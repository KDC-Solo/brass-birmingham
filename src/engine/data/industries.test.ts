import { describe, expect, it } from 'vitest';
import { INDUSTRY_TRACKS, tileSpec } from './industries';
import { RESOURCE_INDUSTRIES, SELLABLE_INDUSTRIES } from '../types';

describe('industry tile tracks', () => {
  it('has the right tile totals per industry', () => {
    const totals = Object.fromEntries(
      Object.entries(INDUSTRY_TRACKS).map(([k, tiles]) => [k, tiles.reduce((a, t) => a + t.count, 0)]),
    );
    expect(totals).toEqual({ cotton: 11, goods: 11, pottery: 5, coal: 7, iron: 4, brewery: 7 });
  });

  it('level-1 tiles are canal-only except pottery', () => {
    for (const [industry, tiles] of Object.entries(INDUSTRY_TRACKS)) {
      const level1 = tiles.find((t) => t.level === 1)!;
      if (industry === 'pottery') expect(level1.eras).toContain('rail');
      else expect(level1.eras).toEqual(['canal']);
    }
  });

  it('pottery 5 and brewery 4 are rail-only', () => {
    expect(tileSpec('pottery', 5).eras).toEqual(['rail']);
    expect(tileSpec('brewery', 4).eras).toEqual(['rail']);
  });

  it('only the two lightbulb potteries cannot be developed', () => {
    const locked = Object.values(INDUSTRY_TRACKS)
      .flat()
      .filter((t) => !t.canDevelop);
    expect(locked.map((t) => `${t.industry}${t.level}`).sort()).toEqual(['pottery1', 'pottery3']);
  });

  it('sellable industries have beer requirements; resource industries produce', () => {
    for (const industry of SELLABLE_INDUSTRIES) {
      for (const t of INDUSTRY_TRACKS[industry]) expect(t.beerToSell).not.toBeUndefined();
    }
    for (const industry of RESOURCE_INDUSTRIES) {
      for (const t of INDUSTRY_TRACKS[industry]) {
        expect(t.beerToSell).toBeUndefined();
        expect((t.producesCoal ?? 0) + (t.producesIron ?? 0) + (t.producesBeer ? 1 : 0)).toBeGreaterThan(0);
      }
    }
  });

  it('two goods tiles sell without beer (levels 3 and 7)', () => {
    const freeSells = INDUSTRY_TRACKS.goods.filter((t) => t.beerToSell === 0).map((t) => t.level);
    expect(freeSells).toEqual([3, 7]);
  });

  it('spot-checks tile stats against the player mat', () => {
    expect(tileSpec('cotton', 4)).toMatchObject({ cost: 18, costCoal: 1, costIron: 1, vp: 12, incomeBump: 2 });
    expect(tileSpec('pottery', 5)).toMatchObject({ cost: 24, costCoal: 2, vp: 20, beerToSell: 2 });
    expect(tileSpec('coal', 1)).toMatchObject({ cost: 5, producesCoal: 2, linkVP: 2, incomeBump: 4 });
    expect(tileSpec('iron', 4)).toMatchObject({ cost: 12, costCoal: 1, producesIron: 6, vp: 9 });
    expect(tileSpec('goods', 6)).toMatchObject({ cost: 20, costCoal: 0, costIron: 0, vp: 7, incomeBump: 6 });
    expect(tileSpec('brewery', 4)).toMatchObject({ vp: 10, producesBeer: { canal: 1, rail: 2 } });
  });
});
