import type { CityId, LocationId, PlayerId } from './types';
import { tileSpec } from './data/industries';
import { COAL_MARKET, IRON_MARKET, buyCost, nextBuyPrice } from './market';
import { bumpSpaces } from './income';
import { AUTOMA, HUMAN, log, type GameState } from './state';
import { CITIES } from './data/board';
import { connectedToMarket, distancesFrom } from './connectivity';

export interface MineRef {
  city: CityId;
  slot: number;
  owner: PlayerId;
  distance: number;
}

/** Flip a resource tile that just emptied; bump the owner's income. */
export function flipResourceTile(state: GameState, city: CityId, slot: number): void {
  const tile = state.board[city][slot]!;
  tile.flipped = true;
  const spec = tileSpec(tile.industry, tile.level);
  if (tile.owner === HUMAN) {
    state.players[HUMAN].incomeSpace = bumpSpaces(state.players[HUMAN].incomeSpace, spec.incomeBump);
  }
  log(state, `${tile.owner === HUMAN ? 'You' : 'Automa'} flipped ${tile.industry} L${tile.level} in ${CITIES[city].name}.`);
}

function removeFromTile(state: GameState, city: CityId, slot: number, n: number): number {
  const tile = state.board[city][slot]!;
  const taken = Math.min(tile.resources, n);
  tile.resources -= taken;
  if (tile.resources === 0 && !tile.flipped) flipResourceTile(state, city, slot);
  return taken;
}

/** Coal mines with coal, reachable from `at`, sorted by link distance. */
export function reachableMines(state: GameState, at: LocationId): MineRef[] {
  const dist = distancesFrom(state, at);
  const mines: MineRef[] = [];
  for (const [cityId, slots] of Object.entries(state.board)) {
    const d = dist.get(cityId as CityId);
    if (d === undefined) continue;
    slots.forEach((tile, slot) => {
      if (tile && tile.industry === 'coal' && tile.resources > 0) {
        mines.push({ city: cityId as CityId, slot, owner: tile.owner, distance: d });
      }
    });
  }
  return mines.sort((a, b) => a.distance - b.distance);
}

export interface CoalPlan {
  /** Mines to draw from, in order */
  takes: { city: CityId; slot: number; count: number }[];
  fromMarket: number;
  marketCost: number;
  ok: boolean;
}

/**
 * Plan consuming `n` coal at location `at`. Closest mines are mandatory;
 * ties broken preferring `preferOwner`'s mines (Automa prefers its own;
 * for the human we also prefer their own on ties). Market coal requires a
 * merchant connection and is only available once reachable mines are dry.
 */
export function planCoal(state: GameState, at: LocationId, n: number, consumer: PlayerId): CoalPlan {
  const plan: CoalPlan = { takes: [], fromMarket: 0, marketCost: 0, ok: false };
  let remaining = n;
  const mines = reachableMines(state, at);
  const taken = new Map<string, number>();
  while (remaining > 0 && mines.length > 0) {
    const closest = mines.filter((m) => m.distance === mines[0].distance);
    closest.sort((a, b) => Number(b.owner === consumer) - Number(a.owner === consumer));
    const mine = closest[0];
    const key = `${mine.city}:${mine.slot}`;
    const tile = state.board[mine.city][mine.slot]!;
    const already = taken.get(key) ?? 0;
    const available = tile.resources - already;
    const take = Math.min(available, remaining);
    if (take > 0) {
      taken.set(key, already + take);
      const existing = plan.takes.find((t) => t.city === mine.city && t.slot === mine.slot);
      if (existing) existing.count += take;
      else plan.takes.push({ city: mine.city, slot: mine.slot, count: take });
      remaining -= take;
    }
    if (take === available || take === 0) {
      mines.splice(mines.indexOf(mine), 1);
    }
  }
  if (remaining > 0) {
    if (!connectedToMarket(state, at)) return plan; // no market access: fail
    plan.fromMarket = remaining;
    plan.marketCost = buyCost(COAL_MARKET, state.coalCubes, remaining);
  }
  plan.ok = true;
  return plan;
}

export function executeCoalPlan(state: GameState, plan: CoalPlan, consumer: PlayerId): void {
  for (const take of plan.takes) removeFromTile(state, take.city, take.slot, take.count);
  if (plan.fromMarket > 0) {
    state.coalCubes = Math.max(0, state.coalCubes - plan.fromMarket);
    if (consumer === HUMAN) state.players[HUMAN].money -= plan.marketCost;
  }
}

export interface IronPlan {
  takes: { city: CityId; slot: number; count: number }[];
  fromMarket: number;
  marketCost: number;
  ok: boolean;
}

/** Iron works anywhere with iron; market only when every works is empty. */
export function planIron(state: GameState, n: number, consumer: PlayerId): IronPlan {
  const plan: IronPlan = { takes: [], fromMarket: 0, marketCost: 0, ok: false };
  let remaining = n;
  const works: { city: CityId; slot: number; owner: PlayerId; resources: number }[] = [];
  for (const [cityId, slots] of Object.entries(state.board)) {
    slots.forEach((tile, slot) => {
      if (tile && tile.industry === 'iron' && tile.resources > 0) {
        works.push({ city: cityId as CityId, slot, owner: tile.owner, resources: tile.resources });
      }
    });
  }
  works.sort((a, b) => Number(b.owner === consumer) - Number(a.owner === consumer));
  for (const w of works) {
    if (remaining === 0) break;
    const take = Math.min(w.resources, remaining);
    plan.takes.push({ city: w.city, slot: w.slot, count: take });
    remaining -= take;
  }
  if (remaining > 0) {
    plan.fromMarket = remaining;
    plan.marketCost = buyCost(IRON_MARKET, state.ironCubes, remaining);
  }
  plan.ok = true;
  return plan;
}

export function executeIronPlan(state: GameState, plan: IronPlan, consumer: PlayerId): void {
  for (const take of plan.takes) removeFromTile(state, take.city, take.slot, take.count);
  if (plan.fromMarket > 0) {
    state.ironCubes = Math.max(0, state.ironCubes - plan.fromMarket);
    if (consumer === HUMAN) state.players[HUMAN].money -= plan.marketCost;
  }
}

/** Whether any iron exists on board works (Automa £0 develop condition). */
export function boardIronAvailable(state: GameState): boolean {
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile && tile.industry === 'iron' && tile.resources > 0) return true;
    }
  }
  return false;
}

export function ironMarketPrice(state: GameState): number {
  return nextBuyPrice(IRON_MARKET, state.ironCubes);
}

export { AUTOMA };
