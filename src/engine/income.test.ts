import { describe, expect, it } from 'vitest';
import { STARTING_SPACE, bumpSpaces, canTakeLoan, highestSpaceForLevel, levelForSpace, loanDrop } from './income';

describe('income track', () => {
  it('starts at space 10 = level 0', () => {
    expect(levelForSpace(STARTING_SPACE)).toBe(0);
  });

  it('maps band boundaries correctly', () => {
    expect(levelForSpace(0)).toBe(-10);
    expect(levelForSpace(11)).toBe(1);
    expect(levelForSpace(30)).toBe(10);
    expect(levelForSpace(31)).toBe(11);
    expect(levelForSpace(60)).toBe(20);
    expect(levelForSpace(61)).toBe(21);
    expect(levelForSpace(96)).toBe(29);
    expect(levelForSpace(97)).toBe(30);
    expect(levelForSpace(99)).toBe(30);
  });

  it('round-trips highest space per level', () => {
    for (let level = -10; level <= 30; level++) {
      expect(levelForSpace(highestSpaceForLevel(level))).toBe(level);
    }
  });

  it('caps bumps at the top of the track', () => {
    expect(bumpSpaces(98, 5)).toBe(99);
  });

  it('drops loans to the highest space of the target level', () => {
    // From level 0 (space 10) a loan lands on level -3 (space 7)
    expect(loanDrop(10)).toBe(7);
    // From level 15, target level 12, highest space of 12 = 36
    expect(loanDrop(highestSpaceForLevel(15))).toBe(36);
  });

  it('forbids loans below level -10', () => {
    expect(canTakeLoan(highestSpaceForLevel(-7))).toBe(true);
    expect(canTakeLoan(highestSpaceForLevel(-8))).toBe(false);
  });
});
