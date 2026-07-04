import type { CityId, IndustryType } from '../types';

/**
 * The 22 Mautoma cards, transcribed from the original deck images
 * (fullstackcardboard.com companion app assets, by permission of the PnP
 * being freely published). Verified against the rulebook's example cards.
 *
 * Front: 1–3 action slots, applied first-valid. Back: standard action list
 * (SELL, DEVELOP, NETWORK, PASS) plus first-turn action and the tiebreaker
 * slot index used for building selection.
 */
export type MautomaGroup = 'a' | 'b' | 'c';

export type FrontSlot =
  | {
      kind: 'build';
      industry: Exclude<IndustryType, 'coal' | 'brewery'>;
      cities: readonly CityId[];
      /** Iron works builds: only if acquiring iron costs at least this much */
      ironPriceMin?: number;
      /** May place one link first if needed to reach a coal source */
      linkFirst: boolean;
    }
  | {
      kind: 'buildBrewery';
      cities: readonly CityId[];
      linkFirst: boolean;
    }
  | {
      kind: 'buildCoalWithLinks';
      cities: readonly CityId[];
    }
  | {
      kind: 'network';
      cities: readonly CityId[];
    };

export interface MautomaCard {
  id: number;
  group: MautomaGroup;
  front: readonly FrontSlot[];
  /** First game turn: action printed in the rear's top-left corner */
  firstTurn: 'draw' | 'develop';
  /** Rear SELL fallback: brewery build city */
  sellBreweryCity: CityId;
  /** Rear DEVELOP: max acquisition price per iron cube (0 = board iron only) */
  developIronMax: number;
  /** Rear top-right icon: city slot index (0-based) winning building ties */
  tiebreakerSlot: number;
}

const TB = { NW: 0, NE: 1, SW: 2, SE: 3 } as const;

export const MAUTOMA_CARDS: readonly MautomaCard[] = [
  {
    id: 1, group: 'a',
    front: [
      { kind: 'build', industry: 'iron', cities: ['redditch', 'coalbrookdale'], ironPriceMin: 3, linkFirst: true },
      { kind: 'build', industry: 'pottery', cities: ['coventry'], linkFirst: false },
      { kind: 'network', cities: ['coventry'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'stone', developIronMax: 1, tiebreakerSlot: TB.SW,
  },
  {
    id: 2, group: 'a',
    front: [
      { kind: 'build', industry: 'goods', cities: ['cannock', 'burton'], linkFirst: false },
      { kind: 'build', industry: 'cotton', cities: ['nuneaton'], linkFirst: true },
      { kind: 'network', cities: ['cannock', 'burton', 'nuneaton'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'burton', developIronMax: 3, tiebreakerSlot: TB.NW,
  },
  {
    id: 3, group: 'b',
    front: [
      { kind: 'build', industry: 'iron', cities: ['walsall', 'coalbrookdale', 'dudley'], ironPriceMin: 4, linkFirst: true },
      { kind: 'buildBrewery', cities: ['nuneaton', 'walsall'], linkFirst: false },
      { kind: 'network', cities: ['nuneaton', 'walsall'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'derby', developIronMax: 0, tiebreakerSlot: TB.NW,
  },
  {
    id: 4, group: 'b',
    front: [
      { kind: 'buildBrewery', cities: ['coalbrookdale', 'burton'], linkFirst: false },
      { kind: 'network', cities: ['coalbrookdale', 'burton'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'walsall', developIronMax: 0, tiebreakerSlot: TB.SW,
  },
  {
    id: 5, group: 'c',
    front: [
      { kind: 'buildCoalWithLinks', cities: ['redditch'] },
      { kind: 'network', cities: ['redditch'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'walsall', developIronMax: 4, tiebreakerSlot: TB.NW,
  },
  {
    id: 6, group: 'b',
    front: [
      { kind: 'buildBrewery', cities: ['farmSouth', 'farmNorth'], linkFirst: true },
      { kind: 'buildBrewery', cities: ['stafford'], linkFirst: false },
      { kind: 'network', cities: ['stafford'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'coalbrookdale', developIronMax: 2, tiebreakerSlot: TB.SW,
  },
  {
    id: 7, group: 'a',
    front: [
      { kind: 'build', industry: 'goods', cities: ['wolverhampton', 'redditch'], linkFirst: true },
      { kind: 'network', cities: ['wolverhampton', 'redditch'] },
    ],
    firstTurn: 'develop', sellBreweryCity: 'walsall', developIronMax: 2, tiebreakerSlot: TB.SW,
  },
  {
    id: 8, group: 'a',
    front: [
      { kind: 'build', industry: 'goods', cities: ['coventry'], linkFirst: true },
      { kind: 'build', industry: 'cotton', cities: ['tamworth'], linkFirst: true },
      { kind: 'network', cities: ['coventry', 'tamworth'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'uttoxeter', developIronMax: 0, tiebreakerSlot: TB.NE,
  },
  {
    id: 9, group: 'c',
    front: [
      { kind: 'build', industry: 'goods', cities: ['birmingham'], linkFirst: true },
      { kind: 'buildCoalWithLinks', cities: ['dudley'] },
      { kind: 'network', cities: ['birmingham', 'dudley'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'burton', developIronMax: 2, tiebreakerSlot: TB.NW,
  },
  {
    id: 10, group: 'a',
    front: [
      { kind: 'build', industry: 'iron', cities: ['birmingham', 'redditch', 'coalbrookdale'], ironPriceMin: 3, linkFirst: true },
      { kind: 'build', industry: 'cotton', cities: ['tamworth'], linkFirst: true },
      { kind: 'network', cities: ['tamworth'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'uttoxeter', developIronMax: 0, tiebreakerSlot: TB.NE,
  },
  {
    id: 11, group: 'a',
    front: [
      { kind: 'build', industry: 'pottery', cities: ['stafford'], linkFirst: false },
      { kind: 'build', industry: 'goods', cities: ['birmingham'], linkFirst: true },
      { kind: 'network', cities: ['stafford', 'birmingham'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'coalbrookdale', developIronMax: 0, tiebreakerSlot: TB.NE,
  },
  {
    id: 12, group: 'b',
    front: [
      { kind: 'build', industry: 'iron', cities: ['birmingham', 'coventry', 'coalbrookdale'], ironPriceMin: 3, linkFirst: true },
      { kind: 'buildBrewery', cities: ['walsall'], linkFirst: false },
      { kind: 'network', cities: ['walsall'] },
    ],
    firstTurn: 'develop', sellBreweryCity: 'nuneaton', developIronMax: 2, tiebreakerSlot: TB.SE,
  },
  {
    id: 13, group: 'a',
    front: [
      { kind: 'build', industry: 'iron', cities: ['walsall', 'coventry', 'dudley'], ironPriceMin: 1, linkFirst: true },
      { kind: 'build', industry: 'goods', cities: ['redditch'], linkFirst: false },
      { kind: 'network', cities: ['redditch'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'stafford', developIronMax: 0, tiebreakerSlot: TB.SE,
  },
  {
    id: 14, group: 'c',
    front: [
      { kind: 'build', industry: 'iron', cities: ['coventry', 'coalbrookdale'], ironPriceMin: 2, linkFirst: true },
      { kind: 'buildCoalWithLinks', cities: ['wolverhampton', 'redditch'] },
      { kind: 'network', cities: ['wolverhampton', 'redditch'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'derby', developIronMax: 1, tiebreakerSlot: TB.SE,
  },
  {
    id: 15, group: 'c',
    front: [
      { kind: 'build', industry: 'cotton', cities: ['tamworth'], linkFirst: true },
      { kind: 'buildCoalWithLinks', cities: ['tamworth', 'redditch'] },
      { kind: 'network', cities: ['tamworth', 'redditch'] },
    ],
    firstTurn: 'develop', sellBreweryCity: 'uttoxeter', developIronMax: 2, tiebreakerSlot: TB.NW,
  },
  {
    id: 16, group: 'a',
    front: [
      { kind: 'build', industry: 'iron', cities: ['birmingham', 'redditch', 'coalbrookdale'], ironPriceMin: 3, linkFirst: true },
      { kind: 'build', industry: 'goods', cities: ['nuneaton', 'redditch'], linkFirst: true },
      { kind: 'network', cities: ['nuneaton', 'redditch'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'stone', developIronMax: 4, tiebreakerSlot: TB.NE,
  },
  {
    id: 17, group: 'a',
    front: [
      { kind: 'build', industry: 'cotton', cities: ['worcester', 'birmingham'], linkFirst: true },
      { kind: 'network', cities: ['worcester', 'birmingham'] },
    ],
    firstTurn: 'develop', sellBreweryCity: 'uttoxeter', developIronMax: 1, tiebreakerSlot: TB.NE,
  },
  {
    id: 18, group: 'a',
    front: [
      { kind: 'build', industry: 'goods', cities: ['walsall', 'birmingham'], linkFirst: true },
      { kind: 'network', cities: ['walsall', 'birmingham'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'coalbrookdale', developIronMax: 0, tiebreakerSlot: TB.SE,
  },
  {
    id: 19, group: 'c',
    front: [
      { kind: 'buildCoalWithLinks', cities: ['kidderminster', 'cannock'] },
      { kind: 'network', cities: ['kidderminster', 'cannock'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'burton', developIronMax: 0, tiebreakerSlot: TB.SW,
  },
  {
    id: 20, group: 'a',
    front: [
      { kind: 'build', industry: 'cotton', cities: ['kidderminster', 'worcester'], linkFirst: true },
      { kind: 'network', cities: ['kidderminster', 'worcester'] },
    ],
    firstTurn: 'develop', sellBreweryCity: 'stafford', developIronMax: 2, tiebreakerSlot: TB.NW,
  },
  {
    id: 21, group: 'c',
    front: [
      { kind: 'build', industry: 'iron', cities: ['walsall', 'dudley'], ironPriceMin: 3, linkFirst: true },
      { kind: 'buildCoalWithLinks', cities: ['nuneaton', 'burton'] },
      { kind: 'network', cities: ['nuneaton', 'burton'] },
    ],
    firstTurn: 'draw', sellBreweryCity: 'nuneaton', developIronMax: 0, tiebreakerSlot: TB.SE,
  },
  {
    id: 22, group: 'a',
    front: [
      { kind: 'build', industry: 'cotton', cities: ['worcester', 'kidderminster'], linkFirst: true },
      { kind: 'network', cities: ['worcester', 'kidderminster'] },
    ],
    firstTurn: 'develop', sellBreweryCity: 'nuneaton', developIronMax: 2, tiebreakerSlot: TB.NE,
  },
];

/** Automa starting mats: tile count per industry level, by difficulty. */
export type MautomaDifficulty = 'easy' | 'medium' | 'hard';

export const MAUTOMA_MATS: Record<MautomaDifficulty, Record<IndustryType, readonly number[]>> = {
  // Index = level - 1. Standard mat: goods 1,2,1,1,2,1,1,2; cotton 3,2,3,3;
  // pottery 1,1,1,1,1; coal 1,2,2,2; iron 1,1,1,1; brewery 2,2,2,1.
  easy: {
    goods: [1, 2, 1, 1, 2, 1, 1, 2],
    cotton: [2, 2, 3, 3],
    pottery: [1, 1, 1, 1, 1],
    coal: [0, 2, 2, 2],
    iron: [1, 1, 1, 1],
    brewery: [1, 2, 2, 1],
  },
  medium: {
    goods: [0, 2, 0, 0, 1, 1, 1, 2],
    cotton: [2, 1, 3, 3],
    pottery: [1, 1, 1, 1, 1],
    coal: [0, 1, 2, 2],
    iron: [0, 1, 1, 1],
    brewery: [1, 2, 2, 1],
  },
  hard: {
    goods: [0, 2, 0, 0, 0, 1, 1, 2],
    cotton: [2, 1, 1, 3],
    pottery: [1, 1, 1, 1, 1],
    coal: [0, 1, 2, 2],
    iron: [0, 1, 1, 1],
    brewery: [1, 2, 2, 1],
  },
};
