/**
 * The shared progress/income track: spaces 0–99.
 *
 * Spaces 0–10 are income levels −10…0 (one space per level); levels 1–10
 * take two spaces (11–30); 11–20 take three (31–60); 21–29 take four
 * (61–96); level 30 is the top three spaces (97–99).
 *
 * Players start on space 10 (income level 0). Flip bonuses move the marker
 * up by SPACES; loans move it down by LEVELS to the highest space of the
 * target level.
 */
export const STARTING_SPACE = 10;
export const TOP_SPACE = 99;
export const LOAN_AMOUNT = 30;
export const LOAN_LEVEL_DROP = 3;
export const MIN_LOAN_LEVEL = -10;

export function levelForSpace(space: number): number {
  if (space < 0 || space > TOP_SPACE) throw new Error(`Invalid income space ${space}`);
  if (space <= 10) return space - 10;
  if (space <= 30) return Math.ceil((space - 10) / 2);
  if (space <= 60) return 10 + Math.ceil((space - 30) / 3);
  if (space <= 96) return 20 + Math.ceil((space - 60) / 4);
  return 30;
}

export function highestSpaceForLevel(level: number): number {
  if (level < -10 || level > 30) throw new Error(`Invalid income level ${level}`);
  if (level <= 0) return level + 10;
  if (level <= 10) return 10 + level * 2;
  if (level <= 20) return 30 + (level - 10) * 3;
  if (level <= 29) return 60 + (level - 20) * 4;
  return TOP_SPACE;
}

/** Move up `n` spaces (flip bonuses, Oxford merchant bonus), capped at the top. */
export function bumpSpaces(space: number, n: number): number {
  return Math.min(TOP_SPACE, space + n);
}

/** Whether a loan may be taken from this space. */
export function canTakeLoan(space: number): boolean {
  return levelForSpace(space) - LOAN_LEVEL_DROP >= MIN_LOAN_LEVEL;
}

/** Apply a loan's income drop: 3 levels down, to the highest space of that level. */
export function loanDrop(space: number): number {
  const target = levelForSpace(space) - LOAN_LEVEL_DROP;
  if (target < MIN_LOAN_LEVEL) throw new Error('Loan would drop income below -10');
  return highestSpaceForLevel(target);
}
