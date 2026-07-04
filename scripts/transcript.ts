/**
 * Generate a full game transcript for playtest review:
 *   npx vite-node scripts/transcript.ts [seed] [difficulty]
 */
import { AUTOMA, HUMAN, newGame } from '../src/engine/state';
import { applyHumanAction, type HumanAction } from '../src/engine/game';
import { canLoan, legalBuilds, legalDevelops, legalNetworks, legalSells, scoutAllowed } from '../src/engine/options';
import { makeRng, nextFloat, nextInt, type Rng } from '../src/engine/rng';
import { levelForSpace } from '../src/engine/income';
import type { GameState } from '../src/engine/state';

const seed = Number(process.argv[2] ?? 42);
const difficulty = (process.argv[3] ?? 'medium') as 'easy' | 'medium' | 'hard';

function pickAction(state: GameState, rng: Rng): HumanAction {
  const sells = legalSells(state);
  if (sells.length > 0) {
    const c = sells[nextInt(rng, sells.length)];
    return { type: 'sell', cardIdx: c.cardIdx, sales: [{ sale: c.sale, beer: c.beer }] };
  }
  const builds = legalBuilds(state);
  // Greedy-ish: prefer the most expensive affordable build (better tiles)
  if (builds.length > 0 && nextFloat(rng) < 0.8) {
    const sorted = [...builds].sort((a, b) => b.option.totalCost - a.option.totalCost);
    return { type: 'build', cardIdx: sorted[0].cardIdx, option: sorted[0].option };
  }
  const networks = legalNetworks(state);
  if (networks.length > 0 && nextFloat(rng) < 0.6) {
    const c = networks[nextInt(rng, networks.length)];
    return { type: 'network', cardIdx: c.cardIdx, option: c.option };
  }
  const develops = legalDevelops(state);
  if (develops.length > 0 && nextFloat(rng) < 0.5) {
    const c = develops[nextInt(rng, develops.length)];
    return { type: 'develop', cardIdx: c.cardIdx, industries: c.industries };
  }
  if (canLoan(state) && state.players[HUMAN].money < 12) return { type: 'loan', cardIdx: 0 };
  if (scoutAllowed(state)) return { type: 'scout', cardIdx: 0, extraDiscards: [1, 2] };
  if (builds.length > 0) return { type: 'build', cardIdx: builds[0].cardIdx, option: builds[0].option };
  return { type: 'pass', cardIdx: 0 };
}

const state = newGame(seed, difficulty);
const rng = makeRng(seed + 1000);
let logCursor = 0;
let safety = 0;

function flush(prefix: string): void {
  for (; logCursor < state.log.length; logCursor++) {
    console.log(`${prefix} ${state.log[logCursor]}`);
  }
}

flush('     ');
while (!state.gameOver && safety < 300) {
  safety++;
  const action = pickAction(state, rng);
  const label = `[${state.era[0].toUpperCase()}${state.turn}·a${3 - state.actionsLeft}]`;
  console.log(`${label} >>> human ${action.type}${'option' in action ? ` ${JSON.stringify({ city: (action.option as { city?: string }).city, links: (action.option as { linkIds?: string[] }).linkIds })}` : ''}`);
  applyHumanAction(state, action);
  flush(label);
}

console.log('\n=== FINAL ===');
console.log(`Human: ${state.players[HUMAN].vp} VP, £${state.players[HUMAN].money}, income ${levelForSpace(state.players[HUMAN].incomeSpace)}`);
console.log(`Automa: ${state.players[AUTOMA].vp} VP (difficulty ${difficulty})`);
