import { describe, expect, it } from 'vitest';
import { COAL_MARKET, IRON_MARKET, buyCost, nextBuyPrice, nextSellPrice, sellToMarket } from './market';

describe('coal market', () => {
  it('starts at £1 with 13 cubes', () => {
    expect(nextBuyPrice(COAL_MARKET, COAL_MARKET.initialCubes)).toBe(1);
  });

  it('costs £8 per cube when empty', () => {
    expect(nextBuyPrice(COAL_MARKET, 0)).toBe(8);
    expect(buyCost(COAL_MARKET, 0, 2)).toBe(16);
  });

  it('prices climb as cubes are bought', () => {
    // 13 cubes: one £1 cube, then the £2s
    expect(buyCost(COAL_MARKET, 13, 3)).toBe(1 + 2 + 2);
  });

  it('sells into the cheapest empty space', () => {
    // At setup one £1 space is open
    expect(nextSellPrice(COAL_MARKET, COAL_MARKET.initialCubes)).toBe(1);
    const result = sellToMarket(COAL_MARKET, 13, 2);
    expect(result).toEqual({ revenue: 1, absorbed: 1, cubesAfter: 14 });
  });

  it('buy then sell is money-neutral', () => {
    const buy = nextBuyPrice(COAL_MARKET, 13);
    expect(nextSellPrice(COAL_MARKET, 12)).toBe(buy);
  });
});

describe('iron market', () => {
  it('starts at £2 with 8 cubes (both £1 spaces open)', () => {
    expect(nextBuyPrice(IRON_MARKET, IRON_MARKET.initialCubes)).toBe(2);
  });

  it('costs £6 per cube when empty', () => {
    expect(nextBuyPrice(IRON_MARKET, 0)).toBe(6);
  });

  it('absorbs at most its capacity when selling', () => {
    const result = sellToMarket(IRON_MARKET, 8, 4);
    expect(result.absorbed).toBe(2);
    expect(result.revenue).toBe(1 + 1);
    expect(result.cubesAfter).toBe(10);
  });
});
