import type { CityId, Era, IndustryType, PlayerId } from './types';
import { CITIES, LINKS, MERCHANTS } from './data/board';
import { tileSpec } from './data/industries';
import { COAL_MARKET, IRON_MARKET, sellToMarket } from './market';
import { LOAN_AMOUNT, bumpSpaces, canTakeLoan, levelForSpace, loanDrop } from './income';
import { HUMAN, log, type Card, type GameState, type PlacedTile } from './state';
import { areConnected, connectedToMarket, hasNoNetwork, playerNetwork } from './connectivity';
import { executeCoalPlan, executeIronPlan, flipResourceTile, planCoal, planIron, type CoalPlan, type IronPlan } from './resources';

export class RuleError extends Error {}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new RuleError(message);
}

// ---------------------------------------------------------------- helpers

export function lowestBuildable(state: GameState, player: PlayerId, industry: IndustryType): number | null {
  const track = state.players[player].mat[industry];
  for (let i = 0; i < track.length; i++) {
    if (track[i] > 0) return i + 1;
  }
  return null;
}

export function tileAllowedInEra(industry: IndustryType, level: number, era: Era): boolean {
  return tileSpec(industry, level).eras.includes(era);
}

/**
 * Slot resolution for building `industry` in `city`. Free single-industry
 * slots must be used before shared ones. Returns eligible slot indices in
 * preference order (all equally-preferred candidates).
 */
export function eligibleSlots(state: GameState, city: CityId, industry: IndustryType): number[] {
  const spec = CITIES[city];
  const free = spec.slots
    .map((allowed, i) => ({ allowed, i }))
    .filter(({ allowed, i }) => state.board[city][i] === null && allowed.includes(industry));
  const single = free.filter(({ allowed }) => allowed.length === 1);
  return (single.length > 0 ? single : free).map(({ i }) => i);
}

/** Overbuild candidates: occupied slots this player may replace. */
export function overbuildSlots(state: GameState, player: PlayerId, city: CityId, industry: IndustryType, level: number): number[] {
  const result: number[] = [];
  state.board[city].forEach((tile, i) => {
    if (!tile) return;
    if (!CITIES[city].slots[i].includes(industry)) return;
    if (tile.industry !== industry || tile.level >= level) return;
    if (tile.owner === player) {
      result.push(i);
    } else if (industry === 'coal' || industry === 'iron') {
      // Opponent overbuild: no cubes of that resource anywhere, market included
      const marketEmpty = industry === 'coal' ? state.coalCubes === 0 : state.ironCubes === 0;
      if (!marketEmpty) return;
      for (const slots of Object.values(state.board)) {
        for (const t of slots) {
          if (t && t.industry === industry && t.resources > 0) return;
        }
      }
      result.push(i);
    }
  });
  return result;
}

function canalEraCityBlocked(state: GameState, player: PlayerId, city: CityId, overbuildSlot: number | null): boolean {
  if (state.era !== 'canal') return false;
  return state.board[city].some((tile, i) => tile?.owner === player && i !== overbuildSlot);
}

/** Place a tile, produce resources, auto-sell coal/iron to the market. */
export function placeTile(state: GameState, player: PlayerId, city: CityId, slot: number, industry: IndustryType, level: number): void {
  const spec = tileSpec(industry, level);
  state.players[player].mat[industry][level - 1] -= 1;
  const tile: PlacedTile = { owner: player, industry, level, flipped: false, resources: 0 };
  if (spec.producesCoal) tile.resources = spec.producesCoal;
  if (spec.producesIron) tile.resources = spec.producesIron;
  if (spec.producesBeer) tile.resources = spec.producesBeer[state.era];
  state.board[city][slot] = tile;
  log(state, `${player === HUMAN ? 'You' : 'Automa'} built ${industry} L${level} in ${CITIES[city].name}.`);

  if (industry === 'iron' && tile.resources > 0) {
    const { revenue, absorbed, cubesAfter } = sellToMarket(IRON_MARKET, state.ironCubes, tile.resources);
    state.ironCubes = cubesAfter;
    tile.resources -= absorbed;
    if (player === HUMAN) state.players[HUMAN].money += revenue;
    if (tile.resources === 0) flipResourceTile(state, city, slot);
  }
  if (industry === 'coal' && tile.resources > 0 && connectedToMarket(state, city)) {
    const { revenue, absorbed, cubesAfter } = sellToMarket(COAL_MARKET, state.coalCubes, tile.resources);
    state.coalCubes = cubesAfter;
    tile.resources -= absorbed;
    if (player === HUMAN) state.players[HUMAN].money += revenue;
    if (tile.resources === 0) flipResourceTile(state, city, slot);
  }
}

// ---------------------------------------------------------------- build

export interface BuildOption {
  city: CityId;
  industry: IndustryType;
  level: number;
  slot: number;
  overbuild: boolean;
  moneyCost: number;
  coalPlan: CoalPlan | null;
  ironPlan: IronPlan | null;
  totalCost: number;
}

export function cardAllowsBuild(state: GameState, player: PlayerId, card: Card, city: CityId, industry: IndustryType): boolean {
  const isFarm = CITIES[city].isFarmBrewery;
  switch (card.kind) {
    case 'location':
      return !isFarm && card.city === city;
    case 'wildLocation':
      return !isFarm;
    case 'industry':
    case 'wildIndustry': {
      if (card.kind === 'industry' && !card.industries.includes(industry)) return false;
      if (isFarm && industry !== 'brewery') return false;
      return hasNoNetwork(state, player) || playerNetwork(state, player).has(city);
    }
  }
}

/** Compute a build option (or null if illegal), independent of card choice. */
export function buildOption(state: GameState, player: PlayerId, city: CityId, industry: IndustryType): BuildOption | null {
  if (!CITIES[city].slots.some((s) => s.includes(industry))) return null;
  const level = lowestBuildable(state, player, industry);
  if (level === null) return null;
  if (!tileAllowedInEra(industry, level, state.era)) return null;

  const spec = tileSpec(industry, level);
  let slot: number | null = null;
  let overbuild = false;
  const free = eligibleSlots(state, city, industry);
  if (free.length > 0) {
    slot = free[0];
  } else {
    const over = overbuildSlots(state, player, city, industry, level);
    if (over.length > 0) {
      slot = over[0];
      overbuild = true;
    }
  }
  if (slot === null) return null;
  if (canalEraCityBlocked(state, player, city, overbuild ? slot : null)) return null;

  const coalPlan = spec.costCoal > 0 ? planCoal(state, city, spec.costCoal, player) : null;
  if (coalPlan && !coalPlan.ok) return null;
  const ironPlan = spec.costIron > 0 ? planIron(state, spec.costIron, player) : null;
  const totalCost = spec.cost + (coalPlan?.marketCost ?? 0) + (ironPlan?.marketCost ?? 0);
  if (player === HUMAN && totalCost > state.players[HUMAN].money) return null;

  return { city, industry, level, slot, overbuild, moneyCost: spec.cost, coalPlan, ironPlan, totalCost };
}

export function applyBuild(state: GameState, player: PlayerId, option: BuildOption): void {
  if (option.overbuild) {
    const old = state.board[option.city][option.slot]!;
    log(state, `${player === HUMAN ? 'You' : 'Automa'} overbuilt ${old.industry} L${old.level} in ${CITIES[option.city].name}.`);
    state.board[option.city][option.slot] = null;
  }
  if (player === HUMAN) {
    state.players[HUMAN].money -= option.moneyCost;
    state.players[HUMAN].spent += option.totalCost;
  }
  if (option.coalPlan) executeCoalPlan(state, option.coalPlan, player);
  if (option.ironPlan) executeIronPlan(state, option.ironPlan, player);
  placeTile(state, player, option.city, option.slot, option.industry, option.level);
}

// ---------------------------------------------------------------- network

export interface NetworkOption {
  linkIds: string[];
  moneyCost: number;
  coalPlans: CoalPlan[];
  beerSource: BeerSource | null;
  totalCost: number;
}

export function linkTouchesNetwork(state: GameState, player: PlayerId, linkId: string): boolean {
  const link = LINKS.find((l) => l.id === linkId)!;
  if (hasNoNetwork(state, player)) return true;
  const network = playerNetwork(state, player);
  return link.endpoints.some((e) => network.has(e));
}

export function networkSingleOption(state: GameState, player: PlayerId, linkId: string): NetworkOption | null {
  const link = LINKS.find((l) => l.id === linkId);
  if (!link || state.links[linkId] != null) return null;
  if (state.era === 'canal' && !link.canal) return null;
  if (state.era === 'rail' && !link.rail) return null;
  if (!linkTouchesNetwork(state, player, linkId)) return null;

  if (state.era === 'canal') {
    if (player === HUMAN && state.players[HUMAN].money < 3) return null;
    return { linkIds: [linkId], moneyCost: 3, coalPlans: [], beerSource: null, totalCost: 3 };
  }
  // Rail: £5 + 1 coal, connected to either end of the new link
  const coalPlan = bestCoalPlanForLink(state, player, linkId);
  if (!coalPlan) return null;
  const totalCost = 5 + coalPlan.marketCost;
  if (player === HUMAN && state.players[HUMAN].money < totalCost) return null;
  return { linkIds: [linkId], moneyCost: 5, coalPlans: [coalPlan], beerSource: null, totalCost };
}

function bestCoalPlanForLink(state: GameState, player: PlayerId, linkId: string): CoalPlan | null {
  const link = LINKS.find((l) => l.id === linkId)!;
  let best: CoalPlan | null = null;
  for (const end of link.endpoints) {
    const plan = planCoal(state, end, 1, player);
    if (plan.ok && (best === null || plan.marketCost < best.marketCost)) best = plan;
  }
  return best;
}

export function applyNetworkSingle(state: GameState, player: PlayerId, option: NetworkOption): void {
  const linkId = option.linkIds[0];
  state.links[linkId] = player;
  if (player === HUMAN) {
    // executeCoalPlan deducts any market coal cost itself
    state.players[HUMAN].money -= option.moneyCost;
    state.players[HUMAN].spent += option.totalCost;
  }
  for (const plan of option.coalPlans) executeCoalPlan(state, plan, player);
  log(state, `${player === HUMAN ? 'You' : 'Automa'} built a ${state.era === 'canal' ? 'canal' : 'rail'} link: ${linkId}.`);
}

// ---------------------------------------------------------------- beer

export type BeerSource =
  | { kind: 'own'; city: CityId; slot: number }
  | { kind: 'opponent'; city: CityId; slot: number }
  | { kind: 'merchant'; merchantIdx: number; beerIdx: number };

/**
 * Beer sources usable by `player` for an action at `at` (selling building or
 * second rail link). Own breweries need no connection; opponents' do.
 * Merchant beer is only usable when selling via that merchant.
 */
export function beerSources(state: GameState, player: PlayerId, at: CityId, sellingVia: number | null): BeerSource[] {
  const sources: BeerSource[] = [];
  if (sellingVia !== null) {
    const merchant = state.merchants[sellingVia];
    merchant.beer.forEach((available, beerIdx) => {
      if (available && merchant.tiles[beerIdx] !== 'blank') {
        sources.push({ kind: 'merchant', merchantIdx: sellingVia, beerIdx });
      }
    });
  }
  for (const [cityId, slots] of Object.entries(state.board)) {
    slots.forEach((tile, slot) => {
      if (!tile || tile.industry !== 'brewery' || tile.resources === 0) return;
      if (tile.owner === player) {
        sources.push({ kind: 'own', city: cityId as CityId, slot });
      } else if (areConnected(state, at, cityId as CityId)) {
        sources.push({ kind: 'opponent', city: cityId as CityId, slot });
      }
    });
  }
  return sources;
}

export function consumeBeer(state: GameState, player: PlayerId, source: BeerSource): void {
  if (source.kind === 'merchant') {
    const merchant = state.merchants[source.merchantIdx];
    merchant.beer[source.beerIdx] = false;
    grantMerchantBonus(state, player, merchant.id);
    return;
  }
  const tile = state.board[source.city][source.slot]!;
  tile.resources -= 1;
  if (tile.resources === 0 && !tile.flipped) flipResourceTile(state, source.city, source.slot);
}

function grantMerchantBonus(state: GameState, player: PlayerId, merchantId: keyof typeof MERCHANTS): void {
  const bonus = MERCHANTS[merchantId].bonus;
  const p = state.players[player];
  switch (bonus.kind) {
    case 'vp':
      p.vp += bonus.amount;
      log(state, `Merchant bonus: +${bonus.amount} VP (${merchantId}).`);
      break;
    case 'money':
      if (player === HUMAN) p.money += bonus.amount;
      log(state, `Merchant bonus: +£${bonus.amount} (${merchantId}).`);
      break;
    case 'incomeSpaces':
      if (player === HUMAN) p.incomeSpace = bumpSpaces(p.incomeSpace, bonus.amount);
      log(state, `Merchant bonus: +${bonus.amount} income spaces (${merchantId}).`);
      break;
    case 'develop': {
      // Remove the lowest developable tile: the human is prompted in the UI;
      // engine default develops the cheapest track (Automa never gets this
      // bonus with VP semantics, and per FAQ only takes VP bonuses).
      if (player === HUMAN) developOneFree(state, HUMAN);
      break;
    }
  }
}

function developOneFree(state: GameState, player: PlayerId): void {
  const mat = state.players[player].mat;
  for (const industry of ['cotton', 'goods', 'coal', 'iron', 'brewery', 'pottery'] as IndustryType[]) {
    const level = lowestBuildable(state, player, industry);
    if (level !== null && tileSpec(industry, level).canDevelop) {
      mat[industry][level - 1] -= 1;
      log(state, `Gloucester bonus: developed ${industry} L${level} for free.`);
      return;
    }
  }
}

// ---------------------------------------------------------------- sell

export interface SellableBuilding {
  city: CityId;
  slot: number;
  merchantIdx: number;
  beerNeeded: number;
}

export function merchantBuys(kind: string, industry: IndustryType): boolean {
  return kind === 'any' || kind === industry;
}

/** Buildings `player` could flip via SELL right now (ignoring beer supply). */
export function sellableBuildings(state: GameState, player: PlayerId): SellableBuilding[] {
  const result: SellableBuilding[] = [];
  for (const [cityId, slots] of Object.entries(state.board)) {
    slots.forEach((tile, slot) => {
      if (!tile || tile.owner !== player || tile.flipped) return;
      const spec = tileSpec(tile.industry, tile.level);
      if (spec.beerToSell === undefined) return;
      for (let m = 0; m < state.merchants.length; m++) {
        const merchant = state.merchants[m];
        if (!merchant.tiles.some((t) => merchantBuys(t, tile.industry))) continue;
        if (!areConnected(state, cityId as CityId, merchant.id)) continue;
        result.push({ city: cityId as CityId, slot, merchantIdx: m, beerNeeded: spec.beerToSell });
        return; // one merchant listing suffices for sellability
      }
    });
  }
  return result;
}

/** Flip one building as part of a SELL action, consuming chosen beer. */
export function sellBuilding(state: GameState, player: PlayerId, sale: SellableBuilding, beer: BeerSource[]): void {
  const tile = state.board[sale.city][sale.slot]!;
  assert(beer.length === sale.beerNeeded, 'Wrong beer count for sale');
  // Cannot mix two different merchants' beer for one 2-beer tile
  const merchantBeers = beer.filter((b) => b.kind === 'merchant');
  assert(merchantBeers.length <= 1, 'Cannot use two merchant beers on one tile');
  for (const source of beer) consumeBeer(state, player, source);
  tile.flipped = true;
  const spec = tileSpec(tile.industry, tile.level);
  if (player === HUMAN) {
    state.players[HUMAN].incomeSpace = bumpSpaces(state.players[HUMAN].incomeSpace, spec.incomeBump);
  }
  log(state, `${player === HUMAN ? 'You' : 'Automa'} sold ${tile.industry} L${tile.level} in ${CITIES[sale.city].name}.`);
}

// ---------------------------------------------------------------- develop / loan / scout / pass

export function developCost(state: GameState, player: PlayerId, industries: IndustryType[]): IronPlan | null {
  const plan = planIron(state, industries.length, player);
  if (!plan.ok) return null;
  if (player === HUMAN && plan.marketCost > state.players[HUMAN].money) return null;
  return plan;
}

export function applyDevelop(state: GameState, player: PlayerId, industries: IndustryType[]): void {
  assert(industries.length >= 1 && industries.length <= 2, 'Develop removes 1 or 2 tiles');
  const plan = developCost(state, player, industries);
  assert(plan, 'Cannot pay iron for develop');
  // Validate all removals before mutating
  const mat = state.players[player].mat;
  const removals: { industry: IndustryType; level: number }[] = [];
  const counted = new Map<IndustryType, number>();
  for (const industry of industries) {
    const skip = counted.get(industry) ?? 0;
    let level: number | null = null;
    let seen = 0;
    for (let i = 0; i < mat[industry].length; i++) {
      if (mat[industry][i] > 0) {
        const availableHere = mat[industry][i];
        if (seen + availableHere > skip) {
          level = i + 1;
          break;
        }
        seen += availableHere;
      }
    }
    assert(level !== null, `No ${industry} tile to develop`);
    assert(tileSpec(industry, level).canDevelop, `${industry} L${level} cannot be developed`);
    removals.push({ industry, level });
    counted.set(industry, skip + 1);
  }
  executeIronPlan(state, plan, player);
  if (player === HUMAN) state.players[HUMAN].spent += plan.marketCost;
  for (const removal of removals) {
    mat[removal.industry][removal.level - 1] -= 1;
    log(state, `${player === HUMAN ? 'You' : 'Automa'} developed ${removal.industry} L${removal.level}.`);
  }
}

export function applyLoan(state: GameState): void {
  const p = state.players[HUMAN];
  assert(canTakeLoan(p.incomeSpace), 'Income would drop below -10');
  p.money += LOAN_AMOUNT;
  p.incomeSpace = loanDrop(p.incomeSpace);
  log(state, `You took a £30 loan (income now ${levelForSpace(p.incomeSpace)}).`);
}

export function canScout(state: GameState): boolean {
  const hand = state.players[HUMAN].hand;
  if (hand.some((c) => c.kind === 'wildLocation' || c.kind === 'wildIndustry')) return false;
  if (state.drawPile.length === 0 && hand.length <= 2) return false; // last round
  return hand.length >= 3;
}

export function applyScout(state: GameState, extraDiscards: [number, number]): void {
  assert(canScout(state), 'Scout not allowed');
  const hand = state.players[HUMAN].hand;
  const [a, b] = [...extraDiscards].sort((x, y) => y - x);
  assert(a !== b && hand[a] && hand[b], 'Scout needs two distinct extra cards');
  hand.splice(a, 1);
  hand.splice(b, 1);
  hand.push({ kind: 'wildLocation' }, { kind: 'wildIndustry' });
  log(state, 'You scouted: gained wild location + wild industry cards.');
}
