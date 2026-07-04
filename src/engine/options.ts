import type { CityId, IndustryType } from './types';
import { CITIES } from './data/board';
import { INDUSTRY_TRACKS, tileSpec } from './data/industries';
import { HUMAN, type Card, type GameState } from './state';
import {
  beerSources, buildOption, canScout, cardAllowsBuild, developCost, networkSingleOption,
  sellableBuildings, type BeerSource, type BuildOption, type NetworkOption, type SellableBuilding,
} from './actions';
import { canTakeLoan } from './income';
import { LINKS } from './data/board';

export interface BuildChoice {
  cardIdx: number;
  option: BuildOption;
}

/** All legal (card, build) combinations for the human right now. */
export function legalBuilds(state: GameState): BuildChoice[] {
  const hand = state.players[HUMAN].hand;
  const result: BuildChoice[] = [];
  const cities = Object.keys(CITIES) as CityId[];
  const options = new Map<string, BuildOption | null>();
  for (const city of cities) {
    for (const industry of Object.keys(INDUSTRY_TRACKS) as IndustryType[]) {
      const key = `${city}:${industry}`;
      options.set(key, buildOption(state, HUMAN, city, industry));
    }
  }
  hand.forEach((card, cardIdx) => {
    for (const [key, option] of options) {
      if (!option) continue;
      const [city, industry] = key.split(':') as [CityId, IndustryType];
      if (cardAllowsBuild(state, HUMAN, card, city, industry)) {
        result.push({ cardIdx, option });
      }
    }
  });
  return result;
}

export interface NetworkChoice {
  cardIdx: number;
  option: NetworkOption;
}

export function legalNetworks(state: GameState): NetworkChoice[] {
  if (state.players[HUMAN].hand.length === 0) return [];
  const result: NetworkChoice[] = [];
  for (const link of LINKS) {
    const option = networkSingleOption(state, HUMAN, link.id);
    if (option) result.push({ cardIdx: 0, option });
  }
  return result;
}

export interface SellChoice {
  cardIdx: number;
  sale: SellableBuilding;
  beer: BeerSource[];
}

/** Beer plan for one sale: merchant beer first (bonus), then own, then opponent's. */
export function planBeerForSale(state: GameState, sale: SellableBuilding): BeerSource[] | null {
  const beer: BeerSource[] = [];
  const used = new Set<string>();
  const keyOf = (s: BeerSource) =>
    s.kind === 'merchant' ? `m:${s.merchantIdx}:${s.beerIdx}` : `${s.kind}:${s.city}:${s.slot}`;
  const usedFromTile = new Map<string, number>();
  for (let i = 0; i < sale.beerNeeded; i++) {
    const sources = beerSources(state, HUMAN, sale.city, sale.merchantIdx).filter((s) => {
      const key = keyOf(s);
      if (s.kind === 'merchant') return !used.has(key);
      const tile = state.board[s.city][s.slot]!;
      return (usedFromTile.get(key) ?? 0) < tile.resources;
    });
    if (sources.length === 0) return null;
    const hasMerchantAlready = beer.some((b) => b.kind === 'merchant');
    const pick =
      sources.find((s) => s.kind === 'merchant' && !hasMerchantAlready) ??
      sources.find((s) => s.kind === 'own') ??
      sources[0];
    if (pick.kind === 'merchant' && hasMerchantAlready) return null;
    beer.push(pick);
    const key = keyOf(pick);
    used.add(key);
    if (pick.kind !== 'merchant') usedFromTile.set(key, (usedFromTile.get(key) ?? 0) + 1);
  }
  return beer;
}

export function legalSells(state: GameState): SellChoice[] {
  if (state.players[HUMAN].hand.length === 0) return [];
  return sellableBuildings(state, HUMAN)
    .map((sale) => ({ cardIdx: 0, sale, beer: planBeerForSale(state, sale) }))
    .filter((c): c is SellChoice => c.beer !== null);
}

export interface DevelopChoice {
  cardIdx: number;
  industries: IndustryType[];
}

export function legalDevelops(state: GameState): DevelopChoice[] {
  if (state.players[HUMAN].hand.length === 0) return [];
  const result: DevelopChoice[] = [];
  for (const industry of Object.keys(INDUSTRY_TRACKS) as IndustryType[]) {
    const track = state.players[HUMAN].mat[industry];
    const level = track.findIndex((c) => c > 0) + 1;
    if (level === 0) continue;
    if (!tileSpec(industry, level).canDevelop) continue;
    if (developCost(state, HUMAN, [industry])) result.push({ cardIdx: 0, industries: [industry] });
  }
  return result;
}

export function canLoan(state: GameState): boolean {
  return state.players[HUMAN].hand.length > 0 && canTakeLoan(state.players[HUMAN].incomeSpace);
}

export function scoutAllowed(state: GameState): boolean {
  return canScout(state);
}

export function handCards(state: GameState): Card[] {
  return state.players[HUMAN].hand;
}
