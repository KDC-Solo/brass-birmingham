import type { LocationId } from '../types';

/**
 * Schematic map coordinates (original layout, roughly geographic). Used by
 * the UI's SVG board and by the Automa's clockwise-from-north tiebreaker.
 * ViewBox is 900 × 860.
 */
export const LAYOUT: Record<LocationId, { x: number; y: number }> = {
  // Merchants (edges)
  warrington: { x: 200, y: 30 },
  nottingham: { x: 840, y: 100 },
  shrewsbury: { x: 40, y: 370 },
  gloucester: { x: 90, y: 800 },
  oxford: { x: 620, y: 780 },
  // Cities
  leek: { x: 450, y: 60 },
  belper: { x: 730, y: 70 },
  stoke: { x: 320, y: 125 },
  derby: { x: 750, y: 175 },
  uttoxeter: { x: 480, y: 175 },
  stone: { x: 205, y: 200 },
  stafford: { x: 270, y: 285 },
  burton: { x: 625, y: 295 },
  cannock: { x: 360, y: 370 },
  farmNorth: { x: 395, y: 300 },
  tamworth: { x: 640, y: 395 },
  wolverhampton: { x: 260, y: 440 },
  walsall: { x: 440, y: 445 },
  nuneaton: { x: 715, y: 475 },
  coalbrookdale: { x: 115, y: 470 },
  dudley: { x: 300, y: 525 },
  birmingham: { x: 540, y: 550 },
  coventry: { x: 755, y: 580 },
  kidderminster: { x: 200, y: 615 },
  redditch: { x: 500, y: 655 },
  farmSouth: { x: 185, y: 680 },
  worcester: { x: 220, y: 735 },
};
