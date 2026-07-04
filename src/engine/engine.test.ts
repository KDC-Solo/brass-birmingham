import { describe, expect, it } from 'vitest';
import { AUTOMA, HUMAN, newGame } from './state';
import { applyHumanAction } from './game';
import { legalBuilds, legalNetworks } from './options';
import { levelForSpace } from './income';

describe('game setup', () => {
  it('deals 8 cards and an 11-card canal draw pile', () => {
    const state = newGame(42, 'easy');
    expect(state.players[HUMAN].hand).toHaveLength(8);
    expect(state.drawPile).toHaveLength(11);
    expect(state.actionsLeft).toBe(1);
    expect(state.players[HUMAN].money).toBe(17);
    expect(levelForSpace(state.players[HUMAN].incomeSpace)).toBe(0);
  });

  it('prepares a 22-card automa deck with the 10/3/9 structure', () => {
    const state = newGame(7, 'medium');
    expect(state.automaDeck).toHaveLength(22);
    expect(new Set(state.automaDeck).size).toBe(22);
  });

  it('is deterministic for a given seed', () => {
    const a = newGame(123, 'hard');
    const b = newGame(123, 'hard');
    expect(a.automaDeck).toEqual(b.automaDeck);
    expect(a.players[HUMAN].hand).toEqual(b.players[HUMAN].hand);
    expect(a.merchants).toEqual(b.merchants);
  });

  it('gives the Automa a difficulty-adjusted mat', () => {
    const easy = newGame(1, 'easy');
    const hard = newGame(1, 'hard');
    expect(easy.players[AUTOMA].mat.coal[0]).toBe(0);
    expect(easy.players[AUTOMA].mat.cotton[0]).toBe(2);
    expect(hard.players[AUTOMA].mat.goods[0]).toBe(0);
    expect(hard.players[AUTOMA].mat.iron[0]).toBe(0);
  });
});

describe('first turn', () => {
  it('offers builds on the first turn and runs a full round after one action', () => {
    const state = newGame(42, 'easy');
    const builds = legalBuilds(state);
    expect(builds.length).toBeGreaterThan(0);
    const before = state.players[HUMAN].hand.length;
    applyHumanAction(state, { type: 'build', cardIdx: builds[0].cardIdx, option: builds[0].option });
    // One action on turn 1 → automa ran, income round happened, turn 2 begins
    expect(state.turn).toBe(2);
    expect(state.actionsLeft).toBe(2);
    expect(state.players[HUMAN].hand.length).toBe(8);
    expect(before).toBe(8);
  });

  it('canal era: no rail-only links are offered', () => {
    const state = newGame(42, 'easy');
    // Give the player a network first so links are legal at all
    const builds = legalBuilds(state);
    applyHumanAction(state, { type: 'build', cardIdx: builds[0].cardIdx, option: builds[0].option });
    for (const choice of legalNetworks(state)) {
      expect(choice.option.linkIds.every((id) => !['belper-leek', 'coventry-nuneaton'].includes(id))).toBe(true);
    }
  });
});

describe('loan', () => {
  it('adds £30 and drops three income levels', () => {
    const state = newGame(42, 'easy');
    applyHumanAction(state, { type: 'loan', cardIdx: 0 });
    // Turn 1 had a single action; the round then ended with income -3
    expect(state.players[HUMAN].money).toBe(17 + 30 - 3);
    expect(levelForSpace(state.players[HUMAN].incomeSpace)).toBe(-3);
  });
});
