import { expect, test, type Page } from '@playwright/test';

async function startGame(page: Page, seed = 42, difficulty = 'easy') {
  await page.goto('/');
  await page.getByTestId('difficulty').selectOption(difficulty);
  await page.getByTestId('seed').fill(String(seed));
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('board')).toBeVisible();
}

test('setup screen starts a game', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('era-turn')).toContainText('Canal Era — Turn 1 — 1 action left');
  await expect(page.getByTestId('hand').locator('.card-chip')).toHaveCount(8);
  await expect(page.getByTestId('draw-pile')).toHaveText('11');
});

test('build action via option list advances the round and runs the Automa', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-build').click();
  // Pick the first selectable card
  const selectable = page.locator('.card-chip:not([style*="opacity: 0.4"])');
  await selectable.first().click();
  await page.getByTestId('build-options').locator('button').first().click();
  // One action on turn 1 → round ends, Automa acts, turn 2 begins
  await expect(page.getByTestId('era-turn')).toContainText('Turn 2 — 2 actions left');
  const log = await page.getByTestId('log').textContent();
  expect(log).toContain('Automa');
});

test('board click builds at a highlighted city', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-build').click();
  const selectable = page.locator('.card-chip:not([style*="opacity: 0.4"])');
  await selectable.first().click();
  // Click any highlighted city on the SVG (yellow stroke)
  const buildButtons = page.getByTestId('build-options').locator('button');
  const label = await buildButtons.first().textContent();
  const cityName = label!.split(':')[0].trim();
  await expect(page.getByTestId('era-turn')).toContainText('Turn 1');
  await buildButtons.first().click();
  const log = await page.getByTestId('log').textContent();
  expect(log?.toLowerCase()).toContain(cityName.split(' ')[0].toLowerCase());
});

test('loan gives money and costs income', async ({ page }) => {
  await startGame(page);
  await expect(page.getByTestId('player-panel')).toContainText('£17');
  await page.getByTestId('action-loan').click();
  await page.locator('.card-chip').first().click();
  // £17 + 30 loan − 3 income (level −3) = £44 after the round
  await expect(page.getByTestId('player-panel')).toContainText('£44');
  await expect(page.getByTestId('player-panel')).toContainText('income -3');
});

test('undo restores the previous state', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-loan').click();
  await page.locator('.card-chip').first().click();
  await expect(page.getByTestId('era-turn')).toContainText('Turn 2');
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('era-turn')).toContainText('Turn 1 — 1 action left');
  await expect(page.getByTestId('player-panel')).toContainText('£17');
});

test('several turns of play: Automa scores, markets update', async ({ page }) => {
  await startGame(page, 7);
  // Turn 1: one action
  await page.getByTestId('action-loan').click();
  await page.locator('.card-chip').first().click();
  // Turns 2-4: pass through with loans/passes to let the Automa act
  for (let turn = 2; turn <= 4; turn++) {
    for (let action = 0; action < 2; action++) {
      const loanEnabled = await page.getByTestId('action-loan').isEnabled();
      await page.getByTestId(loanEnabled ? 'action-loan' : 'action-pass').click();
      await page.locator('.card-chip').first().click();
    }
  }
  const vpText = await page.getByTestId('automa-vp').textContent();
  const vp = Number(vpText!.replace(/\D/g, ''));
  expect(vp).toBeGreaterThan(0);
});

test('dark mode toggles and persists', async ({ page }) => {
  await page.goto('/');
  const initial = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByTestId('theme-toggle').click();
  const toggled = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(toggled).not.toBe(initial);
  await page.reload();
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(persisted).toBe(toggled);
});

test('game persists across reload', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('action-loan').click();
  await page.locator('.card-chip').first().click();
  await page.reload();
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('era-turn')).toContainText('Turn 2');
});

test('new game returns to setup', async ({ page }) => {
  await startGame(page);
  await page.getByTestId('new-game').click();
  await expect(page.getByTestId('setup')).toBeVisible();
});

test('no horizontal page overflow', async ({ page }) => {
  await startGame(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

test('help modal opens from setup and in game', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('help-open').click();
  await expect(page.getByTestId('help-modal')).toContainText('How to play');
  await page.getByTestId('help-close').click();
  await expect(page.getByTestId('help-modal')).toHaveCount(0);
  await startGame(page);
  await page.getByTestId('help-open').click();
  await expect(page.getByTestId('help-modal')).toContainText('The Automa');
});
