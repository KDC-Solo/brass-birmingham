import type { CityId, CitySpec, LinkSpec, MerchantId, MerchantSpec, MerchantTileKind } from '../types';

/**
 * Board topology and slots.
 *
 * Link graph verified identical across the TTS mod (built from game assets)
 * and a second implementation; slot industries cross-checked between two
 * implementations and the rulebook map. See docs/DATA_SOURCES.md.
 */
export const CITIES: Record<CityId, CitySpec> = {
  belper: { id: 'belper', name: 'Belper', isFarmBrewery: false, slots: [['cotton', 'goods'], ['coal'], ['pottery']] },
  derby: { id: 'derby', name: 'Derby', isFarmBrewery: false, slots: [['cotton', 'brewery'], ['cotton', 'goods'], ['iron']] },
  leek: { id: 'leek', name: 'Leek', isFarmBrewery: false, slots: [['cotton', 'goods'], ['cotton', 'coal']] },
  stoke: { id: 'stoke', name: 'Stoke-on-Trent', isFarmBrewery: false, slots: [['cotton', 'goods'], ['pottery', 'iron'], ['goods']] },
  stone: { id: 'stone', name: 'Stone', isFarmBrewery: false, slots: [['cotton', 'brewery'], ['goods', 'coal']] },
  uttoxeter: { id: 'uttoxeter', name: 'Uttoxeter', isFarmBrewery: false, slots: [['goods', 'brewery'], ['cotton', 'brewery']] },
  stafford: { id: 'stafford', name: 'Stafford', isFarmBrewery: false, slots: [['goods', 'brewery'], ['pottery']] },
  burton: { id: 'burton', name: 'Burton-on-Trent', isFarmBrewery: false, slots: [['goods', 'coal'], ['brewery']] },
  cannock: { id: 'cannock', name: 'Cannock', isFarmBrewery: false, slots: [['goods', 'coal'], ['coal']] },
  tamworth: { id: 'tamworth', name: 'Tamworth', isFarmBrewery: false, slots: [['cotton', 'coal'], ['cotton', 'coal']] },
  walsall: { id: 'walsall', name: 'Walsall', isFarmBrewery: false, slots: [['iron', 'goods'], ['goods', 'brewery']] },
  wolverhampton: { id: 'wolverhampton', name: 'Wolverhampton', isFarmBrewery: false, slots: [['goods'], ['goods', 'coal']] },
  coalbrookdale: { id: 'coalbrookdale', name: 'Coalbrookdale', isFarmBrewery: false, slots: [['iron', 'brewery'], ['iron'], ['coal']] },
  dudley: { id: 'dudley', name: 'Dudley', isFarmBrewery: false, slots: [['coal'], ['iron']] },
  kidderminster: { id: 'kidderminster', name: 'Kidderminster', isFarmBrewery: false, slots: [['cotton', 'coal'], ['cotton']] },
  worcester: { id: 'worcester', name: 'Worcester', isFarmBrewery: false, slots: [['cotton'], ['cotton']] },
  birmingham: { id: 'birmingham', name: 'Birmingham', isFarmBrewery: false, slots: [['cotton', 'goods'], ['goods'], ['iron'], ['goods']] },
  coventry: { id: 'coventry', name: 'Coventry', isFarmBrewery: false, slots: [['pottery'], ['goods', 'coal'], ['iron', 'goods']] },
  nuneaton: { id: 'nuneaton', name: 'Nuneaton', isFarmBrewery: false, slots: [['goods', 'brewery'], ['cotton', 'coal']] },
  redditch: { id: 'redditch', name: 'Redditch', isFarmBrewery: false, slots: [['goods', 'coal'], ['iron']] },
  farmNorth: { id: 'farmNorth', name: 'Farm Brewery (North)', isFarmBrewery: true, slots: [['brewery']] },
  farmSouth: { id: 'farmSouth', name: 'Farm Brewery (South)', isFarmBrewery: true, slots: [['brewery']] },
};

export const MERCHANTS: Record<MerchantId, MerchantSpec> = {
  shrewsbury: { id: 'shrewsbury', name: 'Shrewsbury', slotCount: 1, minPlayers: 2, bonus: { kind: 'vp', amount: 4 }, linkVP: 2 },
  gloucester: { id: 'gloucester', name: 'Gloucester', slotCount: 2, minPlayers: 2, bonus: { kind: 'develop', amount: 1 }, linkVP: 2 },
  oxford: { id: 'oxford', name: 'Oxford', slotCount: 2, minPlayers: 2, bonus: { kind: 'incomeSpaces', amount: 2 }, linkVP: 2 },
  warrington: { id: 'warrington', name: 'Warrington', slotCount: 2, minPlayers: 3, bonus: { kind: 'money', amount: 5 }, linkVP: 2 },
  nottingham: { id: 'nottingham', name: 'Nottingham', slotCount: 2, minPlayers: 4, bonus: { kind: 'vp', amount: 3 }, linkVP: 2 },
};

/**
 * All 39 links. The Kidderminster–Worcester link passes through the southern
 * farm brewery: one link tile there joins all three locations.
 */
export const LINKS: readonly LinkSpec[] = [
  { id: 'belper-derby', endpoints: ['belper', 'derby'], canal: true, rail: true },
  { id: 'belper-leek', endpoints: ['belper', 'leek'], canal: false, rail: true },
  { id: 'birmingham-coventry', endpoints: ['birmingham', 'coventry'], canal: true, rail: true },
  { id: 'birmingham-dudley', endpoints: ['birmingham', 'dudley'], canal: true, rail: true },
  { id: 'birmingham-nuneaton', endpoints: ['birmingham', 'nuneaton'], canal: false, rail: true },
  { id: 'birmingham-oxford', endpoints: ['birmingham', 'oxford'], canal: true, rail: true },
  { id: 'birmingham-redditch', endpoints: ['birmingham', 'redditch'], canal: false, rail: true },
  { id: 'birmingham-tamworth', endpoints: ['birmingham', 'tamworth'], canal: true, rail: true },
  { id: 'birmingham-walsall', endpoints: ['birmingham', 'walsall'], canal: true, rail: true },
  { id: 'birmingham-worcester', endpoints: ['birmingham', 'worcester'], canal: true, rail: true },
  { id: 'burton-cannock', endpoints: ['burton', 'cannock'], canal: false, rail: true },
  { id: 'burton-derby', endpoints: ['burton', 'derby'], canal: true, rail: true },
  { id: 'burton-stone', endpoints: ['burton', 'stone'], canal: true, rail: true },
  { id: 'burton-tamworth', endpoints: ['burton', 'tamworth'], canal: true, rail: true },
  { id: 'burton-walsall', endpoints: ['burton', 'walsall'], canal: true, rail: false },
  { id: 'cannock-stafford', endpoints: ['cannock', 'stafford'], canal: true, rail: true },
  { id: 'cannock-farmNorth', endpoints: ['cannock', 'farmNorth'], canal: true, rail: true },
  { id: 'cannock-walsall', endpoints: ['cannock', 'walsall'], canal: true, rail: true },
  { id: 'cannock-wolverhampton', endpoints: ['cannock', 'wolverhampton'], canal: true, rail: true },
  { id: 'coalbrookdale-kidderminster', endpoints: ['coalbrookdale', 'kidderminster'], canal: true, rail: true },
  { id: 'coalbrookdale-shrewsbury', endpoints: ['coalbrookdale', 'shrewsbury'], canal: true, rail: true },
  { id: 'coalbrookdale-wolverhampton', endpoints: ['coalbrookdale', 'wolverhampton'], canal: true, rail: true },
  { id: 'coventry-nuneaton', endpoints: ['coventry', 'nuneaton'], canal: false, rail: true },
  { id: 'derby-nottingham', endpoints: ['derby', 'nottingham'], canal: true, rail: true },
  { id: 'derby-uttoxeter', endpoints: ['derby', 'uttoxeter'], canal: false, rail: true },
  { id: 'dudley-kidderminster', endpoints: ['dudley', 'kidderminster'], canal: true, rail: true },
  { id: 'dudley-wolverhampton', endpoints: ['dudley', 'wolverhampton'], canal: true, rail: true },
  { id: 'gloucester-redditch', endpoints: ['gloucester', 'redditch'], canal: true, rail: true },
  { id: 'gloucester-worcester', endpoints: ['gloucester', 'worcester'], canal: true, rail: true },
  { id: 'kidderminster-farmSouth-worcester', endpoints: ['kidderminster', 'farmSouth', 'worcester'], canal: true, rail: true },
  { id: 'leek-stoke', endpoints: ['leek', 'stoke'], canal: true, rail: true },
  { id: 'nuneaton-tamworth', endpoints: ['nuneaton', 'tamworth'], canal: true, rail: true },
  { id: 'oxford-redditch', endpoints: ['oxford', 'redditch'], canal: true, rail: true },
  { id: 'stafford-stone', endpoints: ['stafford', 'stone'], canal: true, rail: true },
  { id: 'stoke-stone', endpoints: ['stoke', 'stone'], canal: true, rail: true },
  { id: 'stoke-warrington', endpoints: ['stoke', 'warrington'], canal: true, rail: true },
  { id: 'stone-uttoxeter', endpoints: ['stone', 'uttoxeter'], canal: false, rail: true },
  { id: 'tamworth-walsall', endpoints: ['tamworth', 'walsall'], canal: false, rail: true },
  { id: 'walsall-wolverhampton', endpoints: ['walsall', 'wolverhampton'], canal: true, rail: true },
];

/**
 * Merchant tiles placed at setup, by player count (cumulative: a 3-player
 * game uses the 2p and 3p groups). Within each group, tiles are shuffled and
 * dealt to the listed locations' slots.
 */
export const MERCHANT_TILE_GROUPS: Record<2 | 3 | 4, { location: MerchantId; count: number }[]> = {
  2: [
    { location: 'shrewsbury', count: 1 },
    { location: 'gloucester', count: 2 },
    { location: 'oxford', count: 2 },
  ],
  3: [{ location: 'warrington', count: 2 }],
  4: [{ location: 'nottingham', count: 2 }],
};

/** The merchant tile mix entering the shuffle, by player count. */
export const MERCHANT_TILE_MIX: Record<2 | 3 | 4, MerchantTileKind[]> = {
  2: ['any', 'cotton', 'goods', 'blank', 'blank'],
  3: ['any', 'cotton', 'goods', 'pottery', 'blank', 'blank', 'blank'],
  4: ['any', 'any', 'cotton', 'cotton', 'goods', 'goods', 'pottery', 'blank', 'blank'],
};

/** Location card counts in the draw deck, by player count. */
export const LOCATION_CARDS: Record<2 | 3 | 4, Partial<Record<CityId, number>>> = {
  2: {
    stafford: 2, burton: 2, cannock: 2, tamworth: 1, walsall: 1,
    coalbrookdale: 3, dudley: 2, kidderminster: 2, wolverhampton: 2, worcester: 2,
    birmingham: 3, coventry: 3, nuneaton: 1, redditch: 1,
  },
  3: {
    leek: 2, stoke: 3, stone: 2, uttoxeter: 1,
    stafford: 2, burton: 2, cannock: 2, tamworth: 1, walsall: 1,
    coalbrookdale: 3, dudley: 2, kidderminster: 2, wolverhampton: 2, worcester: 2,
    birmingham: 3, coventry: 3, nuneaton: 1, redditch: 1,
  },
  4: {
    belper: 2, derby: 3, leek: 2, stoke: 3, stone: 2, uttoxeter: 2,
    stafford: 2, burton: 2, cannock: 2, tamworth: 1, walsall: 1,
    coalbrookdale: 3, dudley: 2, kidderminster: 2, wolverhampton: 2, worcester: 2,
    birmingham: 3, coventry: 3, nuneaton: 1, redditch: 1,
  },
};

/** Industry card counts in the draw deck, by player count. */
export const INDUSTRY_CARDS: Record<2 | 3 | 4, { industries: readonly ('cotton' | 'goods' | 'pottery' | 'coal' | 'iron' | 'brewery')[]; count: number }[]> = {
  2: [
    { industries: ['iron'], count: 4 },
    { industries: ['coal'], count: 2 },
    { industries: ['pottery'], count: 2 },
    { industries: ['brewery'], count: 5 },
  ],
  3: [
    { industries: ['iron'], count: 4 },
    { industries: ['coal'], count: 2 },
    { industries: ['cotton', 'goods'], count: 6 },
    { industries: ['pottery'], count: 2 },
    { industries: ['brewery'], count: 5 },
  ],
  4: [
    { industries: ['iron'], count: 4 },
    { industries: ['coal'], count: 3 },
    { industries: ['cotton', 'goods'], count: 8 },
    { industries: ['pottery'], count: 3 },
    { industries: ['brewery'], count: 5 },
  ],
};

export function isMerchant(id: string): id is MerchantId {
  return id in MERCHANTS;
}

export function linksAt(location: string): readonly LinkSpec[] {
  return LINKS.filter((l) => l.endpoints.includes(location as never));
}
