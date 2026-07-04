import type { IndustryType } from './types';
import { tileSpec } from './data/industries';
import { levelForSpace } from './income';
import { HUMAN, buildAutomaDeck, dealEra, log, type Card, type GameState } from './state';
import {
  applyBuild, applyDevelop, applyLoan, applyNetworkSingle, applyScout, cardAllowsBuild,
  sellBuilding, type BeerSource, type BuildOption, type NetworkOption, type SellableBuilding,
} from './actions';
import { runAutomaTurn } from './mautoma/bot';
import { canalEraCleanup, scoreFlippedIndustries, scoreLinks } from './scoring';

export type HumanAction =
  | { type: 'build'; cardIdx: number; option: BuildOption }
  | { type: 'network'; cardIdx: number; option: NetworkOption }
  | { type: 'sell'; cardIdx: number; sales: { sale: SellableBuilding; beer: BeerSource[] }[] }
  | { type: 'develop'; cardIdx: number; industries: IndustryType[] }
  | { type: 'loan'; cardIdx: number }
  | { type: 'scout'; cardIdx: number; extraDiscards: [number, number] }
  | { type: 'pass'; cardIdx: number };

/** Validate the card is usable for this action (build checks specifically). */
function checkCard(state: GameState, action: HumanAction): Card {
  const card = state.players[HUMAN].hand[action.cardIdx];
  if (!card) throw new Error('No such card in hand');
  if (action.type === 'build' && !cardAllowsBuild(state, HUMAN, card, action.option.city, action.option.industry)) {
    throw new Error('Card does not allow this build');
  }
  return card;
}

function discardCard(state: GameState, idx: number): void {
  state.players[HUMAN].hand.splice(idx, 1);
}

/** Apply one human action (one of the turn's two). */
export function applyHumanAction(state: GameState, action: HumanAction): void {
  checkCard(state, action);
  switch (action.type) {
    case 'build':
      applyBuild(state, HUMAN, action.option);
      break;
    case 'network':
      applyNetworkSingle(state, HUMAN, action.option);
      break;
    case 'sell':
      if (action.sales.length === 0) throw new Error('Sell needs at least one sale');
      for (const { sale, beer } of action.sales) sellBuilding(state, HUMAN, sale, beer);
      break;
    case 'develop':
      applyDevelop(state, HUMAN, action.industries);
      break;
    case 'loan':
      applyLoan(state);
      break;
    case 'scout': {
      // Adjust extra discard indices if they fall after the action card
      applyScout(state, action.extraDiscards);
      break;
    }
    case 'pass':
      log(state, 'You passed.');
      break;
  }
  if (action.type === 'scout') {
    // The action card is discarded after scout resolved index bookkeeping:
    // applyScout removed two cards already; remove the action card by value
    // position recomputed by caller contract (cardIdx valid pre-scout).
  }
  discardCardForAction(state, action);
  state.actionsLeft -= 1;
  if (state.actionsLeft === 0) endHumanTurn(state);
}

function discardCardForAction(state: GameState, action: HumanAction): void {
  if (action.type === 'scout') {
    // applyScout already removed the two extra discards (higher indices
    // first); recompute the action card's index shift
    let idx = action.cardIdx;
    for (const removed of action.extraDiscards) {
      if (removed < action.cardIdx) idx -= 1;
    }
    // The scout also appended 2 wilds; idx still valid relative to removals
    discardCard(state, idx);
    return;
  }
  discardCard(state, action.cardIdx);
}

function endHumanTurn(state: GameState): void {
  // Draw back to 8
  const hand = state.players[HUMAN].hand;
  while (hand.length < 8 && state.drawPile.length > 0) {
    hand.push(state.drawPile.pop()!);
  }
  // Automa turn
  runAutomaTurn(state);
  endRound(state);
}

function endRound(state: GameState): void {
  const isLastRound = state.drawPile.length === 0 && state.players[HUMAN].hand.length === 0;
  if (!isLastRound) {
    const income = levelForSpace(state.players[HUMAN].incomeSpace);
    state.players[HUMAN].money += income;
    if (income !== 0) log(state, `Income: ${income >= 0 ? '+' : ''}£${income}.`);
    if (state.players[HUMAN].money < 0) shortfall(state);
    state.turn += 1;
    state.actionsLeft = 2;
    return;
  }
  endEra(state);
}

/** Forced tile sales when income leaves the player below £0. */
function shortfall(state: GameState): void {
  const p = state.players[HUMAN];
  log(state, `Shortfall! You owe £${-p.money}.`);
  const owned: { city: keyof typeof state.board; slot: number; value: number }[] = [];
  for (const [city, slots] of Object.entries(state.board)) {
    slots.forEach((tile, slot) => {
      if (tile?.owner === HUMAN) {
        owned.push({ city: city as keyof typeof state.board, slot, value: Math.floor(tileSpec(tile.industry, tile.level).cost / 2) });
      }
    });
  }
  owned.sort((a, b) => a.value - b.value);
  for (const o of owned) {
    if (p.money >= 0) break;
    const tile = state.board[o.city][o.slot]!;
    state.board[o.city][o.slot] = null;
    p.money += o.value;
    log(state, `Forced sale: ${tile.industry} L${tile.level} in ${o.city} for £${o.value}.`);
  }
  if (p.money < 0) {
    const penalty = Math.min(p.vp, -p.money);
    p.vp -= penalty;
    log(state, `Still short: -${penalty} VP.`);
    p.money = 0;
  }
}

function endEra(state: GameState): void {
  log(state, `--- End of ${state.era === 'canal' ? 'Canal' : 'Rail'} Era ---`);
  scoreLinks(state);
  scoreFlippedIndustries(state);
  if (state.era === 'canal') {
    canalEraCleanup(state);
    state.era = 'rail';
    state.turn = 1;
    state.actionsLeft = 2;
    dealEra(state, 'rail');
    // Reset flipped-industry double counting: flipped tiles stay and score
    // again at game end per the rules (they score at the end of EACH era).
    state.automaDeck = [];
    state.automaDiscard = [];
    resetAutomaDeck(state);
    log(state, 'Rail Era begins.');
    return;
  }
  state.gameOver = true;
  const [you, automa] = state.players;
  log(state, `Final: you ${you.vp} VP — Automa ${automa.vp} VP. ${you.vp > automa.vp ? 'You win!' : you.vp === automa.vp ? 'Tie.' : 'Automa wins.'}`);
}

function resetAutomaDeck(state: GameState): void {
  state.automaDeck = buildAutomaDeck(state.rng);
}
