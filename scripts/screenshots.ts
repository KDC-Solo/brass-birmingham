/**
 * Generate README screenshots against the preview server:
 *   npm run build && npm run preview -- --port 4173 &
 *   npx vite-node scripts/screenshots.ts
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { newGame } from '../src/engine/state';
import { applyHumanAction, type HumanAction } from '../src/engine/game';
import { canLoan, legalBuilds, legalNetworks, legalSells } from '../src/engine/options';
import { makeRng, nextFloat, nextInt, type Rng } from '../src/engine/rng';
import type { GameState } from '../src/engine/state';

const BASE = 'http://localhost:4173';
const OUT = 'docs/screenshots';

function midGameState(seed: number): GameState {
  const state = newGame(seed, 'medium');
  const rng = makeRng(seed + 5);
  let safety = 0;
  // Play into the early Rail Era for an interesting board
  while (!(state.era === 'rail' && state.turn >= 3) && !state.gameOver && safety < 120) {
    safety++;
    const sells = legalSells(state);
    const builds = legalBuilds(state);
    const networks = legalNetworks(state);
    let action: HumanAction;
    if (sells.length > 0) {
      action = { type: 'sell', cardIdx: sells[0].cardIdx, sales: [{ sale: sells[0].sale, beer: sells[0].beer }] };
    } else if (builds.length > 0 && nextFloat(rng) < 0.75) {
      const sorted = [...builds].sort((a, b) => b.option.totalCost - a.option.totalCost);
      action = { type: 'build', cardIdx: sorted[0].cardIdx, option: sorted[0].option };
    } else if (networks.length > 0 && nextFloat(rng) < 0.7) {
      const c = networks[nextInt(rng, networks.length)];
      action = { type: 'network', cardIdx: c.cardIdx, option: c.option };
    } else if (canLoan(state) && state.players[0].money < 12) {
      action = { type: 'loan', cardIdx: 0 };
    } else if (builds.length > 0) {
      action = { type: 'build', cardIdx: builds[0].cardIdx, option: builds[0].option };
    } else {
      action = { type: 'pass', cardIdx: 0 };
    }
    applyHumanAction(state, action);
  }
  return state;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const save = JSON.stringify(midGameState(1234));
  const browser = await chromium.launch();

  async function shot(name: string, opts: { width: number; height: number; theme: 'light' | 'dark'; setup?: boolean }) {
    const context = await browser.newContext({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.addInitScript(
      ([saveData, theme, setup]) => {
        if (!setup) localStorage.setItem('bbsolo-save-v1', saveData);
        localStorage.setItem('bbsolo-theme', theme);
      },
      [save, opts.theme, opts.setup ? '1' : ''] as const,
    );
    await page.goto(BASE);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    await context.close();
    console.log(`${OUT}/${name}.png`);
  }

  await shot('desktop-light', { width: 1280, height: 860, theme: 'light' });
  await shot('desktop-dark', { width: 1280, height: 860, theme: 'dark' });
  await shot('mobile-dark', { width: 393, height: 851, theme: 'dark' });
  await shot('setup-light', { width: 900, height: 700, theme: 'light', setup: true });

  await browser.close();
}

main();
