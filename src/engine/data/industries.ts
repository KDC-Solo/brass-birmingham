import type { IndustryTileSpec, IndustryType } from '../types';

/**
 * Industry tile tracks, as printed on the player mats.
 *
 * Verified against three independent sources (see docs/DATA_SOURCES.md):
 * values agree across all of them. Level-1 tiles are canal-era-only except
 * pottery; pottery 5 and brewery 4 are rail-era-only.
 */
const BOTH = ['canal', 'rail'] as const;
const CANAL = ['canal'] as const;
const RAIL = ['rail'] as const;

export const INDUSTRY_TRACKS: Record<IndustryType, readonly IndustryTileSpec[]> = {
  cotton: [
    { industry: 'cotton', level: 1, count: 3, cost: 12, costCoal: 0, costIron: 0, eras: CANAL, beerToSell: 1, vp: 5, incomeBump: 5, linkVP: 1, canDevelop: true },
    { industry: 'cotton', level: 2, count: 2, cost: 14, costCoal: 1, costIron: 0, eras: BOTH, beerToSell: 1, vp: 5, incomeBump: 4, linkVP: 2, canDevelop: true },
    { industry: 'cotton', level: 3, count: 3, cost: 16, costCoal: 1, costIron: 1, eras: BOTH, beerToSell: 1, vp: 9, incomeBump: 3, linkVP: 1, canDevelop: true },
    { industry: 'cotton', level: 4, count: 3, cost: 18, costCoal: 1, costIron: 1, eras: BOTH, beerToSell: 1, vp: 12, incomeBump: 2, linkVP: 1, canDevelop: true },
  ],
  goods: [
    { industry: 'goods', level: 1, count: 1, cost: 8, costCoal: 1, costIron: 0, eras: CANAL, beerToSell: 1, vp: 3, incomeBump: 5, linkVP: 2, canDevelop: true },
    { industry: 'goods', level: 2, count: 2, cost: 10, costCoal: 0, costIron: 1, eras: BOTH, beerToSell: 1, vp: 5, incomeBump: 1, linkVP: 1, canDevelop: true },
    { industry: 'goods', level: 3, count: 1, cost: 12, costCoal: 2, costIron: 0, eras: BOTH, beerToSell: 0, vp: 4, incomeBump: 4, linkVP: 0, canDevelop: true },
    { industry: 'goods', level: 4, count: 1, cost: 8, costCoal: 0, costIron: 1, eras: BOTH, beerToSell: 1, vp: 3, incomeBump: 6, linkVP: 1, canDevelop: true },
    { industry: 'goods', level: 5, count: 2, cost: 16, costCoal: 1, costIron: 0, eras: BOTH, beerToSell: 2, vp: 8, incomeBump: 2, linkVP: 2, canDevelop: true },
    { industry: 'goods', level: 6, count: 1, cost: 20, costCoal: 0, costIron: 0, eras: BOTH, beerToSell: 1, vp: 7, incomeBump: 6, linkVP: 1, canDevelop: true },
    { industry: 'goods', level: 7, count: 1, cost: 16, costCoal: 1, costIron: 1, eras: BOTH, beerToSell: 0, vp: 9, incomeBump: 4, linkVP: 0, canDevelop: true },
    { industry: 'goods', level: 8, count: 2, cost: 20, costCoal: 0, costIron: 2, eras: BOTH, beerToSell: 1, vp: 11, incomeBump: 1, linkVP: 1, canDevelop: true },
  ],
  pottery: [
    { industry: 'pottery', level: 1, count: 1, cost: 17, costCoal: 0, costIron: 1, eras: BOTH, beerToSell: 1, vp: 10, incomeBump: 5, linkVP: 1, canDevelop: false },
    { industry: 'pottery', level: 2, count: 1, cost: 0, costCoal: 1, costIron: 0, eras: BOTH, beerToSell: 1, vp: 1, incomeBump: 1, linkVP: 1, canDevelop: true },
    { industry: 'pottery', level: 3, count: 1, cost: 22, costCoal: 2, costIron: 0, eras: BOTH, beerToSell: 2, vp: 11, incomeBump: 5, linkVP: 1, canDevelop: false },
    { industry: 'pottery', level: 4, count: 1, cost: 0, costCoal: 1, costIron: 0, eras: BOTH, beerToSell: 1, vp: 1, incomeBump: 1, linkVP: 1, canDevelop: true },
    { industry: 'pottery', level: 5, count: 1, cost: 24, costCoal: 2, costIron: 0, eras: RAIL, beerToSell: 2, vp: 20, incomeBump: 5, linkVP: 1, canDevelop: true },
  ],
  coal: [
    { industry: 'coal', level: 1, count: 1, cost: 5, costCoal: 0, costIron: 0, eras: CANAL, vp: 1, incomeBump: 4, linkVP: 2, canDevelop: true, producesCoal: 2 },
    { industry: 'coal', level: 2, count: 2, cost: 7, costCoal: 0, costIron: 0, eras: BOTH, vp: 2, incomeBump: 7, linkVP: 1, canDevelop: true, producesCoal: 3 },
    { industry: 'coal', level: 3, count: 2, cost: 8, costCoal: 0, costIron: 1, eras: BOTH, vp: 3, incomeBump: 6, linkVP: 1, canDevelop: true, producesCoal: 4 },
    { industry: 'coal', level: 4, count: 2, cost: 10, costCoal: 0, costIron: 1, eras: BOTH, vp: 4, incomeBump: 5, linkVP: 1, canDevelop: true, producesCoal: 5 },
  ],
  iron: [
    { industry: 'iron', level: 1, count: 1, cost: 5, costCoal: 1, costIron: 0, eras: CANAL, vp: 3, incomeBump: 3, linkVP: 1, canDevelop: true, producesIron: 4 },
    { industry: 'iron', level: 2, count: 1, cost: 7, costCoal: 1, costIron: 0, eras: BOTH, vp: 5, incomeBump: 3, linkVP: 1, canDevelop: true, producesIron: 4 },
    { industry: 'iron', level: 3, count: 1, cost: 9, costCoal: 1, costIron: 0, eras: BOTH, vp: 7, incomeBump: 2, linkVP: 1, canDevelop: true, producesIron: 5 },
    { industry: 'iron', level: 4, count: 1, cost: 12, costCoal: 1, costIron: 0, eras: BOTH, vp: 9, incomeBump: 1, linkVP: 1, canDevelop: true, producesIron: 6 },
  ],
  brewery: [
    { industry: 'brewery', level: 1, count: 2, cost: 5, costCoal: 0, costIron: 1, eras: CANAL, vp: 4, incomeBump: 4, linkVP: 2, canDevelop: true, producesBeer: { canal: 1, rail: 2 } },
    { industry: 'brewery', level: 2, count: 2, cost: 7, costCoal: 0, costIron: 1, eras: BOTH, vp: 5, incomeBump: 5, linkVP: 2, canDevelop: true, producesBeer: { canal: 1, rail: 2 } },
    { industry: 'brewery', level: 3, count: 2, cost: 9, costCoal: 0, costIron: 1, eras: BOTH, vp: 7, incomeBump: 5, linkVP: 2, canDevelop: true, producesBeer: { canal: 1, rail: 2 } },
    { industry: 'brewery', level: 4, count: 1, cost: 9, costCoal: 0, costIron: 1, eras: RAIL, vp: 10, incomeBump: 5, linkVP: 2, canDevelop: true, producesBeer: { canal: 1, rail: 2 } },
  ],
};

export function tileSpec(industry: IndustryType, level: number): IndustryTileSpec {
  const spec = INDUSTRY_TRACKS[industry].find((t) => t.level === level);
  if (!spec) throw new Error(`No ${industry} tile at level ${level}`);
  return spec;
}
