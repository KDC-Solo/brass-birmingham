import type { CityId, Era, IndustryType, LocationId, MerchantId, MerchantTileKind, PlayerId } from './types';
import { CITIES, INDUSTRY_CARDS, LOCATION_CARDS, MERCHANTS, MERCHANT_TILE_GROUPS, MERCHANT_TILE_MIX } from './data/board';
import { INDUSTRY_TRACKS } from './data/industries';
import { COAL_MARKET, IRON_MARKET } from './market';
import { STARTING_SPACE } from './income';
import { MAUTOMA_CARDS, MAUTOMA_MATS, type MautomaDifficulty } from './mautoma/cards';
import { makeRng, shuffle, type Rng } from './rng';

export const HUMAN: PlayerId = 0;
export const AUTOMA: PlayerId = 1;

export type Card =
  | { kind: 'location'; city: CityId }
  | { kind: 'industry'; industries: readonly IndustryType[] }
  | { kind: 'wildLocation' }
  | { kind: 'wildIndustry' };

export interface PlacedTile {
  owner: PlayerId;
  industry: IndustryType;
  level: number;
  flipped: boolean;
  resources: number;
}

export interface MerchantState {
  id: MerchantId;
  tiles: MerchantTileKind[];
  /** Beer barrel available per non-blank tile slot */
  beer: boolean[];
}

export interface PlayerState {
  money: number;
  spent: number;
  incomeSpace: number;
  vp: number;
  hand: Card[];
  /** Tiles remaining on the mat: count per level (index = level-1) */
  mat: Record<IndustryType, number[]>;
}

export interface GameState {
  seed: number;
  rng: Rng;
  difficulty: MautomaDifficulty;
  era: Era;
  /** Human turn number within the era, 1-based */
  turn: number;
  /** Whose action it is; the human acts, then the Automa's whole turn runs */
  actionsLeft: number;
  players: [PlayerState, PlayerState];
  board: Record<CityId, (PlacedTile | null)[]>;
  /** linkId -> owner, or null if unbuilt */
  links: Record<string, PlayerId | null>;
  coalCubes: number;
  ironCubes: number;
  merchants: MerchantState[];
  drawPile: Card[];
  /** Mautoma deck: card ids in draw order (index 0 = next to draw) */
  automaDeck: number[];
  automaDiscard: number[];
  automaLastCity: CityId | null;
  automaFirstTurnDone: boolean;
  gameOver: boolean;
  log: string[];
}

export function emptyBoard(): Record<CityId, (PlacedTile | null)[]> {
  const board = {} as Record<CityId, (PlacedTile | null)[]>;
  for (const city of Object.values(CITIES)) {
    board[city.id] = city.slots.map(() => null);
  }
  return board;
}

function standardMat(): Record<IndustryType, number[]> {
  const mat = {} as Record<IndustryType, number[]>;
  for (const [industry, tiles] of Object.entries(INDUSTRY_TRACKS)) {
    const track: number[] = [];
    for (const t of tiles) track[t.level - 1] = t.count;
    mat[industry as IndustryType] = track;
  }
  return mat;
}

function automaMat(difficulty: MautomaDifficulty): Record<IndustryType, number[]> {
  const mat = {} as Record<IndustryType, number[]>;
  for (const [industry, counts] of Object.entries(MAUTOMA_MATS[difficulty])) {
    mat[industry as IndustryType] = [...counts];
  }
  return mat;
}

/** Build the 2-player human deck (the Mautoma uses the 2p card set). */
export function buildHumanDeck(rng: Rng): Card[] {
  const cards: Card[] = [];
  for (const [city, count] of Object.entries(LOCATION_CARDS[2])) {
    for (let i = 0; i < count; i++) cards.push({ kind: 'location', city: city as CityId });
  }
  for (const group of INDUSTRY_CARDS[2]) {
    for (let i = 0; i < group.count; i++) cards.push({ kind: 'industry', industries: group.industries });
  }
  return shuffle(rng, cards);
}

/**
 * Mautoma deck prep (§5.2): bottom-up 4A+3B+3C, then 1 each, then the
 * remaining 9; the deck is then flipped, so draw order is: the ten
 * (4A+3B+3C) first, then the three, then the nine.
 */
export function buildAutomaDeck(rng: Rng): number[] {
  const byGroup = (g: string) => MAUTOMA_CARDS.filter((c) => c.group === g).map((c) => c.id);
  const pools = { a: shuffle(rng, byGroup('a')), b: shuffle(rng, byGroup('b')), c: shuffle(rng, byGroup('c')) };
  const ten = shuffle(rng, [...pools.a.splice(0, 4), ...pools.b.splice(0, 3), ...pools.c.splice(0, 3)]);
  const three = shuffle(rng, [pools.a.shift()!, pools.b.shift()!, pools.c.shift()!]);
  const nine = shuffle(rng, [...pools.a, ...pools.b, ...pools.c]);
  return [...ten, ...three, ...nine];
}

function setupMerchants(rng: Rng): MerchantState[] {
  const mix = shuffle(rng, MERCHANT_TILE_MIX[2]);
  const merchants: MerchantState[] = [];
  let i = 0;
  for (const group of MERCHANT_TILE_GROUPS[2]) {
    const spec = MERCHANTS[group.location];
    const tiles = mix.slice(i, i + group.count);
    i += group.count;
    merchants.push({
      id: spec.id,
      tiles,
      beer: tiles.map((t) => t !== 'blank'),
    });
  }
  return merchants;
}

/** Deal an era's hand + draw pile per Mautoma solo setup (19 canal / 20 rail). */
export function dealEra(state: GameState, era: Era): void {
  const deck = buildHumanDeck(state.rng);
  const eraCount = era === 'canal' ? 19 : 20;
  const eraCards = deck.slice(0, eraCount);
  state.players[HUMAN].hand = eraCards.slice(0, 8);
  state.drawPile = eraCards.slice(8);
}

export function newGame(seed: number, difficulty: MautomaDifficulty): GameState {
  const rng = makeRng(seed);
  const state: GameState = {
    seed,
    rng,
    difficulty,
    era: 'canal',
    turn: 1,
    actionsLeft: 1, // first turn: one action only
    players: [
      { money: 17, spent: 0, incomeSpace: STARTING_SPACE, vp: 0, hand: [], mat: standardMat() },
      { money: 0, spent: 0, incomeSpace: STARTING_SPACE, vp: 0, hand: [], mat: automaMat(difficulty) },
    ],
    board: emptyBoard(),
    links: {},
    coalCubes: COAL_MARKET.initialCubes,
    ironCubes: IRON_MARKET.initialCubes,
    merchants: setupMerchants(rng),
    drawPile: [],
    automaDeck: buildAutomaDeck(rng),
    automaDiscard: [],
    automaLastCity: null,
    automaFirstTurnDone: false,
    gameOver: false,
    log: [],
  };
  dealEra(state, 'canal');
  state.log.push(`New game — ${difficulty} difficulty, seed ${seed}. Canal Era begins.`);
  return state;
}

export function log(state: GameState, message: string): void {
  state.log.push(message);
}

export function cityName(id: LocationId): string {
  return id in CITIES ? CITIES[id as CityId].name : MERCHANTS[id as MerchantId].name;
}
