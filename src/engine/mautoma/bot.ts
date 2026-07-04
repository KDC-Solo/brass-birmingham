import type { CityId, IndustryType, LocationId } from '../types';
import { CITIES, LINKS, isMerchant } from '../data/board';
import { tileSpec } from '../data/industries';
import { IRON_MARKET, nextBuyPrice } from '../market';
import { AUTOMA, HUMAN, log, type GameState } from '../state';
import { areConnected, cityHasFreeSlotFor, openLinks, playerNetwork } from '../connectivity';
import {
  applyBuild, beerSources, buildOption, consumeBeer, eligibleSlots, lowestBuildable,
  sellableBuildings, tileAllowedInEra, type BeerSource, type SellableBuilding,
} from '../actions';
import { boardIronAvailable, executeCoalPlan, executeIronPlan, planCoal, planIron } from '../resources';
import { MAUTOMA_CARDS, type FrontSlot, type MautomaCard } from './cards';
import { LAYOUT } from '../data/layout';

function card(id: number): MautomaCard {
  return MAUTOMA_CARDS.find((c) => c.id === id)!;
}

/** The card whose rear is visible on top of the deck (for tiebreakers). */
function topRear(state: GameState): MautomaCard | null {
  return state.automaDeck.length > 0 ? card(state.automaDeck[0]) : null;
}

// ------------------------------------------------------------ tiebreakers

/**
 * Link placement priority (rulebook p.3). Returns the chosen open link
 * starting from `from`, or null. External merchants only when nothing else
 * is open (or explicitly requested elsewhere).
 */
function chooseLinkFrom(state: GameState, from: LocationId, opts?: { forRailBeer?: boolean; allowMerchant?: boolean }): string | null {
  const network = playerNetwork(state, AUTOMA);
  const candidates = openLinks(state).filter((l) => l.endpoints.includes(from));
  if (candidates.length === 0) return null;

  const nonMerchant = candidates.filter((l) => !l.endpoints.some((e) => isMerchant(e)));
  const pool = nonMerchant.length > 0 && !opts?.allowMerchant ? nonMerchant : candidates;
  if (pool.length === 1) return pool[0].id;

  const others = (l: (typeof pool)[number]) => l.endpoints.filter((e) => e !== from);

  // Rail second link: connect toward beer if none available now
  if (opts?.forRailBeer) {
    const withBeer = pool.filter((l) =>
      others(l).some((e) => !isMerchant(e) && state.board[e as CityId].some((t) => t?.industry === 'brewery' && t.resources > 0)),
    );
    if (withBeer.length === 1) return withBeer[0].id;
    if (withBeer.length > 1) return tiebreakGeometric(state, from, withBeer);
  }

  // 1. Link to a city already in Automa's network
  const toNetwork = pool.filter((l) => others(l).some((e) => network.has(e)));
  if (toNetwork.length === 1) return toNetwork[0].id;
  let pool2 = toNetwork.length > 0 ? toNetwork : pool;

  // 2. Most built industry tiles
  const builtCount = (l: (typeof pool)[number]) =>
    others(l).reduce((sum, e) => (isMerchant(e) ? sum : sum + state.board[e as CityId].filter(Boolean).length), 0);
  const maxBuilt = Math.max(...pool2.map(builtCount));
  pool2 = pool2.filter((l) => builtCount(l) === maxBuilt);
  if (pool2.length === 1) return pool2[0].id;

  // 3. Most free spaces
  const freeCount = (l: (typeof pool2)[number]) =>
    others(l).reduce((sum, e) => (isMerchant(e) ? sum : sum + cityHasFreeSlotFor(state, e as CityId)), 0);
  const maxFree = Math.max(...pool2.map(freeCount));
  pool2 = pool2.filter((l) => freeCount(l) === maxFree);
  if (pool2.length === 1) return pool2[0].id;

  // 4. (Rail) link enabling coal from Automa's own mines
  if (state.era === 'rail') {
    const feedsOwnCoal = pool2.filter((l) =>
      others(l).some((e) => !isMerchant(e) && state.board[e as CityId].some((t) => t?.owner === AUTOMA && t.industry === 'coal' && t.resources > 0)),
    );
    if (feedsOwnCoal.length === 1) return feedsOwnCoal[0].id;
    if (feedsOwnCoal.length > 1) pool2 = feedsOwnCoal;
  }

  return tiebreakGeometric(state, from, pool2);
}

/**
 * Final tiebreak: "start from above the city, go around clockwise". We order
 * candidate links by the compass angle of their other endpoint using the
 * schematic layout coordinates.
 */
function tiebreakGeometric(_state: GameState, from: LocationId, pool: readonly (typeof LINKS)[number][]): string {
  const origin = LAYOUT[from];
  const angleOf = (l: (typeof pool)[number]) => {
    const other = l.endpoints.find((e) => e !== from)!;
    const p = LAYOUT[other];
    // Angle from north, clockwise
    const a = Math.atan2(p.x - origin.x, origin.y - p.y);
    return a < 0 ? a + Math.PI * 2 : a;
  };
  return [...pool].sort((a, b) => angleOf(a) - angleOf(b))[0].id;
}

/** Building-selection tiebreaker (sell/beer choices). */
function tiebreakBuildings(state: GameState, options: { city: CityId; slot: number }[]): { city: CityId; slot: number } {
  if (options.length === 1) return options[0];
  // Most Automa links minus player links at the building's city
  const score = (o: { city: CityId }) => {
    let automaLinks = 0;
    let humanLinks = 0;
    for (const link of LINKS) {
      if (!link.endpoints.includes(o.city)) continue;
      if (state.links[link.id] === AUTOMA) automaLinks++;
      if (state.links[link.id] === HUMAN) humanLinks++;
    }
    return automaLinks - humanLinks;
  };
  let best = [...options].sort((a, b) => score(b) - score(a));
  best = best.filter((o) => score(o) === score(best[0]));
  if (best.length === 1) return best[0];
  // Alphabetical city
  best.sort((a, b) => CITIES[a.city].name.localeCompare(CITIES[b.city].name));
  best = best.filter((o) => o.city === best[0].city);
  if (best.length === 1) return best[0];
  // Tiebreaker icon on the rear of the top deck card
  const tb = topRear(state)?.tiebreakerSlot ?? 0;
  const exact = best.find((o) => o.slot === tb);
  if (exact) return exact;
  const after = best.filter((o) => o.slot > tb).sort((a, b) => a.slot - b.slot);
  return after[0] ?? best.sort((a, b) => a.slot - b.slot)[0];
}

// ------------------------------------------------------------ front slots

/** Try to execute a front action slot. Returns actions consumed (0 = invalid). */
function tryFrontSlot(state: GameState, slot: FrontSlot): number {
  switch (slot.kind) {
    case 'build':
      return tryBuild(state, slot.industry, slot.cities, slot.linkFirst, slot.ironPriceMin);
    case 'buildBrewery':
      return tryBuild(state, 'brewery', slot.cities, slot.linkFirst, undefined);
    case 'buildCoalWithLinks':
      return tryCoalWithLinks(state, slot.cities);
    case 'network':
      return tryFrontNetwork(state, slot.cities);
  }
}

function automaBuildOption(state: GameState, city: CityId, industry: IndustryType) {
  // The Automa never overbuilds
  const option = buildOption(state, AUTOMA, city, industry);
  if (!option || option.overbuild) return null;
  return option;
}

function ironPriceForAutoma(state: GameState): number {
  // Effective price of acquiring iron: board iron is free
  return boardIronAvailable(state) ? 0 : nextBuyPrice(IRON_MARKET, state.ironCubes);
}

function tryBuild(state: GameState, industry: IndustryType, cities: readonly CityId[], linkFirst: boolean, ironPriceMin: number | undefined): number {
  if (industry === 'iron' && ironPriceMin !== undefined) {
    const marketPrice = nextBuyPrice(IRON_MARKET, state.ironCubes);
    if (marketPrice < ironPriceMin) return 0;
  }
  for (const city of cities) {
    const direct = automaBuildOption(state, city, industry);
    if (direct) {
      applyBuild(state, AUTOMA, direct);
      state.automaLastCity = city;
      return 1;
    }
    if (!linkFirst) continue;
    // Direct build failed. If it failed for lack of a coal source, try
    // placing one link to create access, then build (two actions).
    const level = lowestBuildable(state, AUTOMA, industry);
    if (level === null || !tileAllowedInEra(industry, level, state.era)) continue;
    if (tileSpec(industry, level).costCoal === 0) continue;
    if (eligibleSlots(state, city, industry).length === 0) continue;
    if (state.era === 'canal' && state.board[city].some((t) => t?.owner === AUTOMA)) continue;

    const linkId = linkTowardCoal(state, city);
    if (!linkId) continue;
    if (!placeAutomaLink(state, linkId)) continue;
    const after = automaBuildOption(state, city, industry);
    if (after) {
      applyBuild(state, AUTOMA, after);
      state.automaLastCity = city;
    } else {
      log(state, 'Automa placed a link toward coal but still could not build.');
    }
    return 2;
  }
  return 0;
}

/** A link, extending the Automa network, that gives `city` coal access. */
function linkTowardCoal(state: GameState, city: CityId): string | null {
  const network = playerNetwork(state, AUTOMA);
  const candidates = openLinks(state).filter((l) => l.endpoints.some((e) => network.has(e)));
  const viable = candidates.filter((l) => {
    state.links[l.id] = AUTOMA;
    const gives = planCoal(state, city, 1, AUTOMA).ok;
    state.links[l.id] = null;
    return gives;
  });
  if (viable.length === 0) return null;
  if (viable.length === 1) return viable[0].id;
  // Prefer links from the build city itself, then the standard tiebreak
  const fromCity = viable.filter((l) => l.endpoints.includes(city));
  const pool = fromCity.length > 0 ? fromCity : viable;
  const from = pool[0].endpoints.find((e) => pool.every((l) => l.endpoints.includes(e)) && network.has(e)) ?? pool[0].endpoints.find((e) => network.has(e))!;
  return tiebreakGeometric(state, from, pool);
}

/** Place a link for the Automa, consuming rail-era coal (free money). */
function placeAutomaLink(state: GameState, linkId: string, beerForSecond?: boolean): boolean {
  if (state.era === 'rail') {
    const link = LINKS.find((l) => l.id === linkId)!;
    let plan = null;
    for (const end of link.endpoints) {
      const p = planCoal(state, end, 1, AUTOMA);
      if (p.ok) {
        plan = p;
        break;
      }
    }
    if (!plan) return false;
    if (beerForSecond) {
      const beer = automaBeerFor(state, link.endpoints[0] as CityId, null);
      if (!beer) return false;
      consumeBeer(state, AUTOMA, beer);
    }
    executeCoalPlan(state, plan, AUTOMA);
  }
  state.links[linkId] = AUTOMA;
  log(state, `Automa built a ${state.era} link: ${linkId}.`);
  return true;
}

/** Beer for the Automa (merchant first when selling, then own, then human's). */
function automaBeerFor(state: GameState, at: CityId, sellingVia: number | null): BeerSource | null {
  const sources = beerSources(state, AUTOMA, at, sellingVia);
  const merchant = sources.find((s) => s.kind === 'merchant');
  if (merchant) return merchant;
  const own = sources.filter((s) => s.kind === 'own');
  const foreign = sources.filter((s) => s.kind === 'opponent');
  const pick = (list: BeerSource[]) => {
    if (list.length === 0) return null;
    const asBuildings = list.map((s) => ({ city: (s as { city: CityId }).city, slot: (s as { slot: number }).slot }));
    const chosen = tiebreakBuildings(state, asBuildings);
    return list.find((s) => (s as { city: CityId }).city === chosen.city && (s as { slot: number }).slot === chosen.slot)!;
  };
  return pick(own) ?? pick(foreign);
}

function tryCoalWithLinks(state: GameState, cities: readonly CityId[]): number {
  for (const city of cities) {
    const option = automaBuildOption(state, city, 'coal');
    if (!option) continue;
    applyBuild(state, AUTOMA, option);
    state.automaLastCity = city;
    // Then place 1 link (canal) / up to 2 (rail), starting from that city
    placeNetworkLinks(state, city);
    return 2;
  }
  return 0;
}

/** Place era-appropriate link(s) starting from `from` (network actions). */
function placeNetworkLinks(state: GameState, from: CityId): boolean {
  const first = chooseLinkFrom(state, from, { allowMerchant: allowMerchantLinks(state, from) });
  if (!first) return false;
  if (!placeAutomaLink(state, first)) return false;
  const link = LINKS.find((l) => l.id === first)!;
  state.automaLastCity = (link.endpoints.find((e) => e !== from && !isMerchant(e)) as CityId) ?? from;

  if (state.era === 'rail') {
    const reached = link.endpoints.find((e) => e !== from) ?? from;
    if (isMerchant(reached)) {
      // FAQ: if the merchant has more free link spots, place the second there
      const more = chooseLinkFrom(state, reached, { allowMerchant: true });
      if (more) placeAutomaLink(state, more, true);
      return true;
    }
    const second = chooseLinkFrom(state, reached, {
      forRailBeer: true,
      allowMerchant: allowMerchantLinks(state, reached as CityId),
    });
    if (second && placeAutomaLink(state, second, true)) {
      const secondLink = LINKS.find((l) => l.id === second)!;
      state.automaLastCity = (secondLink.endpoints.find((e) => e !== reached && !isMerchant(e)) as CityId) ?? state.automaLastCity;
    }
  }
  return true;
}

function allowMerchantLinks(state: GameState, from: LocationId): boolean {
  // Merchants only when no other path from this location is open
  return openLinks(state)
    .filter((l) => l.endpoints.includes(from))
    .every((l) => l.endpoints.some((e) => isMerchant(e)));
}

function tryFrontNetwork(state: GameState, cities: readonly CityId[]): number {
  const network = playerNetwork(state, AUTOMA);
  for (const city of cities) {
    if (!network.has(city)) continue; // strict rule for the Automa (FAQ)
    if (placeNetworkLinks(state, city)) return 1;
  }
  return 0;
}

// ------------------------------------------------------------ rear slots

function tryRearSell(state: GameState, rear: MautomaCard): number {
  const sellable = sellableBuildings(state, AUTOMA);
  let sold = 0;
  // Sell all it can (FAQ), choosing by tiebreaker when order matters
  for (;;) {
    const candidates = sellableBuildings(state, AUTOMA).filter((s) => {
      const beer: BeerSource[] = [];
      for (let i = 0; i < s.beerNeeded; i++) {
        const source = automaBeerFor(state, s.city, s.merchantIdx);
        if (!source) return false;
        beer.push(source);
        if (source.kind !== 'merchant') break; // just availability probing
      }
      return true;
    });
    if (candidates.length === 0) break;
    const choice = tiebreakBuildings(state, candidates.map((c) => ({ city: c.city, slot: c.slot })));
    const sale = candidates.find((c) => c.city === choice.city && c.slot === choice.slot)!;
    if (!executeAutomaSale(state, sale)) break;
    sold++;
  }
  if (sold > 0) return 1;

  // No building ready to sell: fallbacks
  if (sellable.length > 0) {
    // Connected but out of beer: build a brewery in the rear-side city
    const level = lowestBuildable(state, AUTOMA, 'brewery');
    if (level !== null && tileAllowedInEra('brewery', level, state.era)) {
      const option = automaBuildOption(state, rear.sellBreweryCity, 'brewery');
      if (option) {
        applyBuild(state, AUTOMA, option);
        state.automaLastCity = rear.sellBreweryCity;
        return 1;
      }
    }
    return 0;
  }
  // Not connected: place the single missing link if exactly one is missing
  const missing = findMissingLinkForSale(state);
  if (missing && placeAutomaLink(state, missing)) {
    const link = LINKS.find((l) => l.id === missing)!;
    state.automaLastCity = (link.endpoints.find((e) => !isMerchant(e)) as CityId) ?? state.automaLastCity;
    return 1;
  }
  return 0;
}

function executeAutomaSale(state: GameState, sale: SellableBuilding): boolean {
  const beer: BeerSource[] = [];
  for (let i = 0; i < sale.beerNeeded; i++) {
    const source = automaBeerFor(state, sale.city, sale.merchantIdx);
    if (!source) return false;
    // A single sale cannot mix two merchant beers
    if (source.kind === 'merchant' && beer.some((b) => b.kind === 'merchant')) return false;
    consumeBeer(state, AUTOMA, source);
    beer.push(source);
  }
  const tile = state.board[sale.city][sale.slot]!;
  tile.flipped = true;
  log(state, `Automa sold ${tile.industry} L${tile.level} in ${CITIES[sale.city].name}.`);
  return true;
}

/**
 * Automa unflipped sellable buildings that are one link short of reaching a
 * matching merchant. Returns the link to place (FAQ selection rules).
 */
function findMissingLinkForSale(state: GameState): string | null {
  const options: { linkId: string; city: CityId }[] = [];
  for (const [cityId, slots] of Object.entries(state.board)) {
    for (const tile of slots) {
      if (!tile || tile.owner !== AUTOMA || tile.flipped) continue;
      if (tileSpec(tile.industry, tile.level).beerToSell === undefined) continue;
      for (const link of openLinks(state)) {
        if (!link.endpoints.some((e) => areConnected(state, cityId as CityId, e) || e === cityId)) continue;
        state.links[link.id] = AUTOMA;
        const nowSellable = sellableBuildings(state, AUTOMA).some((s) => s.city === cityId);
        state.links[link.id] = null;
        if (nowSellable) options.push({ linkId: link.id, city: cityId as CityId });
      }
    }
  }
  if (options.length === 0) return null;
  if (options.length === 1) return options[0].linkId;
  // Max potential buildings (built + free), then alphabetical
  const potential = (o: { linkId: string }) => {
    const link = LINKS.find((l) => l.id === o.linkId)!;
    return link.endpoints.reduce(
      (sum, e) => (isMerchant(e) ? sum : sum + state.board[e as CityId].filter(Boolean).length + cityHasFreeSlotFor(state, e as CityId)),
      0,
    );
  };
  options.sort((a, b) => potential(b) - potential(a) || CITIES[a.city].name.localeCompare(CITIES[b.city].name));
  return options[0].linkId;
}

function tryRearDevelop(state: GameState, rear: MautomaCard): number {
  const priceOk = rear.developIronMax === 0 ? boardIronAvailable(state) : ironPriceForAutoma(state) <= rear.developIronMax;
  if (!priceOk) return 0;
  // Consume up to 2 iron: board works first (own preferred), then market
  let consumed = 0;
  for (let i = 0; i < 2; i++) {
    if (boardIronAvailable(state)) {
      const plan = planIron(state, 1, AUTOMA);
      executeIronPlan(state, plan, AUTOMA);
      consumed++;
    } else if (rear.developIronMax > 0 && state.ironCubes > 0 && nextBuyPrice(IRON_MARKET, state.ironCubes) <= rear.developIronMax) {
      state.ironCubes -= 1;
      consumed++;
    } else {
      break;
    }
  }
  if (consumed === 0) return 0;
  state.players[AUTOMA].vp += 3;
  log(state, `Automa developed (consumed ${consumed} iron): +3 VP.`);
  return 1;
}

function tryRearNetwork(state: GameState): number {
  if (!state.automaLastCity) return 0;
  if (!playerNetwork(state, AUTOMA).has(state.automaLastCity)) return 0;
  return placeNetworkLinks(state, state.automaLastCity) ? 1 : 0;
}

function rearPass(state: GameState): number {
  state.players[AUTOMA].vp += 5;
  log(state, 'Automa passed: +5 VP.');
  return 1;
}

// ------------------------------------------------------------ turn driver

function drawAutomaCard(state: GameState): MautomaCard | null {
  const id = state.automaDeck.shift();
  if (id === undefined) return null;
  state.automaDiscard.push(id);
  return card(id);
}

/** Execute the Automa's whole turn. */
export function runAutomaTurn(state: GameState): void {
  // First game turn special case
  if (!state.automaFirstTurnDone) {
    state.automaFirstTurnDone = true;
    const top = topRear(state);
    if (top && top.firstTurn === 'develop') {
      state.ironCubes = Math.max(0, state.ironCubes - 2);
      state.players[AUTOMA].vp += 3;
      log(state, 'Automa first turn: developed (2 iron cubes from market, +3 VP).');
      return;
    }
    const drawn = drawAutomaCard(state);
    if (!drawn) return;
    log(state, `Automa first turn: card ${drawn.id}.`);
    const buildSlots = drawn.front.filter((s) => s.kind !== 'network');
    for (const slot of buildSlots) {
      if (tryFrontSlot(state, slot) > 0) return;
    }
    // Rulebook: if the build is impossible, place a link from the city in
    // the last action slot, even if not in network
    const last = drawn.front[drawn.front.length - 1];
    if (last.kind === 'network') {
      for (const city of last.cities) {
        if (placeNetworkLinks(state, city)) return;
      }
    }
    log(state, 'Automa first turn: no action possible.');
    return;
  }

  // Normal turn: draw until a card offers a valid front slot
  let actions = 0;
  let safety = 0;
  while (actions === 0 && safety < 30) {
    safety++;
    const drawn = drawAutomaCard(state);
    if (!drawn) {
      log(state, 'Automa deck exhausted; Automa passes.');
      state.players[AUTOMA].vp += 5;
      return;
    }
    log(state, `Automa draws card ${drawn.id}.`);
    for (const slot of drawn.front) {
      actions = tryFrontSlot(state, slot);
      if (actions > 0) break;
    }
    if (actions === 0) log(state, `Automa card ${drawn.id}: no valid front action, discarding.`);
  }
  if (actions >= 2) return;

  // Second action from the rear of the new top card
  const rear = topRear(state);
  if (!rear) {
    rearPass(state);
    return;
  }
  if (tryRearSell(state, rear) > 0) return;
  if (tryRearDevelop(state, rear) > 0) return;
  if (tryRearNetwork(state) > 0) return;
  rearPass(state);
}
