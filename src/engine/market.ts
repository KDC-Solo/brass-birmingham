/**
 * Coal and iron markets.
 *
 * Each market is a column of priced spaces; cubes always occupy the
 * most-expensive spaces contiguously, so the whole state is the cube count.
 * Buying takes the cheapest cube (pay its space price); selling fills the
 * cheapest empty space (earn its price). Buying from an empty market costs
 * the over-price (coal £8, iron £6) from the general supply.
 */
export interface MarketSpec {
  /** Space prices, cheapest first */
  prices: readonly number[];
  /** Price per cube once the market is empty */
  emptyPrice: number;
  /** Cubes at setup */
  initialCubes: number;
}

export const COAL_MARKET: MarketSpec = {
  prices: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],
  emptyPrice: 8,
  initialCubes: 13,
};

export const IRON_MARKET: MarketSpec = {
  prices: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  emptyPrice: 6,
  initialCubes: 8,
};

/** Price of the next cube bought when `cubes` remain. */
export function nextBuyPrice(spec: MarketSpec, cubes: number): number {
  if (cubes <= 0) return spec.emptyPrice;
  return spec.prices[spec.prices.length - cubes];
}

/** Total cost to buy `n` cubes when `cubes` remain. */
export function buyCost(spec: MarketSpec, cubes: number, n: number): number {
  let total = 0;
  for (let i = 0; i < n; i++) total += nextBuyPrice(spec, cubes - i);
  return total;
}

/** Money earned for the next cube sold when `cubes` are in the market (0 if full). */
export function nextSellPrice(spec: MarketSpec, cubes: number): number {
  if (cubes >= spec.prices.length) return 0;
  return spec.prices[spec.prices.length - cubes - 1];
}

/**
 * Sell up to `n` cubes into the market. Returns money earned and how many
 * cubes were actually absorbed; the rest stay on the producing tile.
 */
export function sellToMarket(
  spec: MarketSpec,
  cubes: number,
  n: number,
): { revenue: number; absorbed: number; cubesAfter: number } {
  let revenue = 0;
  let absorbed = 0;
  let c = cubes;
  while (absorbed < n && c < spec.prices.length) {
    revenue += nextSellPrice(spec, c);
    c++;
    absorbed++;
  }
  return { revenue, absorbed, cubesAfter: c };
}

/** Current displayed price (what the next cube costs), e.g. for Mautoma iron checks. */
export function marketPrice(spec: MarketSpec, cubes: number): number {
  return nextBuyPrice(spec, cubes);
}
