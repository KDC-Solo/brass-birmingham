import { describe, expect, it } from 'vitest';
import { COAL_MARKET, IRON_MARKET } from './market';
import { AUTOMA, HUMAN, newGame, type GameState } from './state';
import { applyHumanAction, type HumanAction } from './game';
import { canLoan, legalBuilds, legalDevelops, legalNetworks, legalSells, scoutAllowed } from './options';
import { makeRng, nextFloat, nextInt, type Rng } from './rng';
import { tileSpec } from './data/industries';

/**
 * Self-play soak test: a heuristic random player vs the Mautoma across many
 * seeds. Catches rule violations via invariants checked after every action.
 */
function checkInvariants(state: GameState, seed: number): void {
  const context = `seed ${seed}, era ${state.era}, turn ${state.turn}`;
  expect(state.coalCubes, context).toBeGreaterThanOrEqual(0);
  expect(state.coalCubes, context).toBeLessThanOrEqual(COAL_MARKET.prices.length);
  expect(state.ironCubes, context).toBeGreaterThanOrEqual(0);
  expect(state.ironCubes, context).toBeLessThanOrEqual(IRON_MARKET.prices.length);
  expect(state.players[HUMAN].money, context).toBeGreaterThanOrEqual(0);
  for (const player of [HUMAN, AUTOMA]) {
    for (const track of Object.values(state.players[player].mat)) {
      for (const count of track) expect(count, context).toBeGreaterThanOrEqual(0);
    }
  }
  for (const [city, slots] of Object.entries(state.board)) {
    for (const tile of slots) {
      if (!tile) continue;
      expect(tile.resources, `${context} ${city}`).toBeGreaterThanOrEqual(0);
      const spec = tileSpec(tile.industry, tile.level);
      expect(spec.eras.length, `${context} ${city} has ${tile.industry} L${tile.level}`).toBeGreaterThan(0);
      if ((spec.producesCoal || spec.producesIron || spec.producesBeer) && tile.resources === 0) {
        expect(tile.flipped, `${context} ${city}: empty resource tile must be flipped`).toBe(true);
      }
    }
  }
  const deckIds = [...state.automaDeck, ...state.automaDiscard];
  expect(new Set(deckIds).size, context).toBe(deckIds.length);
}

function pickAction(state: GameState, rng: Rng): HumanAction {
  const builds = legalBuilds(state);
  const sells = legalSells(state);
  const networks = legalNetworks(state);
  const develops = legalDevelops(state);

  // Weighted preference: sell > build > network > develop > loan > pass
  const roll = nextFloat(rng);
  if (sells.length > 0 && roll < 0.75) {
    const c = sells[nextInt(rng, sells.length)];
    return { type: 'sell', cardIdx: c.cardIdx, sales: [{ sale: c.sale, beer: c.beer }] };
  }
  if (builds.length > 0 && roll < 0.8) {
    const c = builds[nextInt(rng, builds.length)];
    return { type: 'build', cardIdx: c.cardIdx, option: c.option };
  }
  if (networks.length > 0 && roll < 0.9) {
    const c = networks[nextInt(rng, networks.length)];
    return { type: 'network', cardIdx: c.cardIdx, option: c.option };
  }
  if (develops.length > 0 && roll < 0.93) {
    const c = develops[nextInt(rng, develops.length)];
    return { type: 'develop', cardIdx: c.cardIdx, industries: c.industries };
  }
  if (canLoan(state) && state.players[HUMAN].money < 10) {
    return { type: 'loan', cardIdx: 0 };
  }
  if (scoutAllowed(state) && nextFloat(rng) < 0.3) {
    return { type: 'scout', cardIdx: 0, extraDiscards: [1, 2] };
  }
  if (builds.length > 0) {
    const c = builds[nextInt(rng, builds.length)];
    return { type: 'build', cardIdx: c.cardIdx, option: c.option };
  }
  return { type: 'pass', cardIdx: 0 };
}

function playGame(seed: number): GameState {
  const state = newGame(seed, (['easy', 'medium', 'hard'] as const)[seed % 3]);
  const rng = makeRng(seed * 7 + 1);
  let safety = 0;
  while (!state.gameOver && safety < 300) {
    safety++;
    applyHumanAction(state, pickAction(state, rng));
    checkInvariants(state, seed);
  }
  expect(state.gameOver, `seed ${seed} did not terminate`).toBe(true);
  return state;
}

describe('self-play soak', () => {
  it('plays 30 full games without rule violations', () => {
    const results: { seed: number; human: number; automa: number }[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      const state = playGame(seed);
      results.push({ seed, human: state.players[HUMAN].vp, automa: state.players[AUTOMA].vp });
    }
    // Sanity: scores in plausible ranges
    for (const r of results) {
      expect(r.automa).toBeGreaterThan(20);
      expect(r.automa).toBeLessThan(400);
      expect(r.human).toBeGreaterThanOrEqual(0);
      expect(r.human).toBeLessThan(400);
    }
  }, 120_000);

  it('era structure: canal then rail, ~10 turns each', () => {
    const state = newGame(99, 'easy');
    const rng = makeRng(5);
    let canalTurns = 0;
    while (state.era === 'canal' && !state.gameOver && canalTurns < 50) {
      applyHumanAction(state, pickAction(state, rng));
      canalTurns++;
    }
    expect(state.era).toBe('rail');
    // 1 action on turn 1 + 2 actions × 9 turns = 19 card plays
    expect(canalTurns).toBe(19);
  });
});
