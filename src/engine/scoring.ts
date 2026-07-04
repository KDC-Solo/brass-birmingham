import type { CityId, LocationId, PlayerId } from './types';
import { LINKS, MERCHANTS, isMerchant } from './data/board';
import { tileSpec } from './data/industries';
import { HUMAN, log, type GameState } from './state';

/** Link VP contributed by one location (city tiles' link icons, merchants = 2). */
export function locationLinkVP(state: GameState, id: LocationId): number {
  if (isMerchant(id)) return MERCHANTS[id].linkVP;
  let total = 0;
  for (const tile of state.board[id as CityId]) {
    if (tile) total += tileSpec(tile.industry, tile.level).linkVP;
  }
  return total;
}

export function scoreLinks(state: GameState): void {
  for (const link of LINKS) {
    const owner = state.links[link.id];
    if (owner == null) continue;
    let vp = 0;
    for (const end of link.endpoints) vp += locationLinkVP(state, end);
    state.players[owner].vp += vp;
    log(state, `${owner === HUMAN ? 'You' : 'Automa'} scored ${vp} VP for link ${link.id}.`);
  }
}

export function scoreFlippedIndustries(state: GameState): void {
  const totals: [number, number] = [0, 0];
  for (const slots of Object.values(state.board)) {
    for (const tile of slots) {
      if (tile?.flipped) totals[tile.owner] += tileSpec(tile.industry, tile.level).vp;
    }
  }
  state.players[0].vp += totals[0];
  state.players[1].vp += totals[1];
  log(state, `Era scoring: you +${totals[0]} VP from industries, Automa +${totals[1]} VP.`);
}

/** End-of-Canal-Era cleanup: links off, level-1 tiles off, beer restock. */
export function canalEraCleanup(state: GameState): void {
  for (const link of LINKS) state.links[link.id] = null;
  for (const [cityId, slots] of Object.entries(state.board)) {
    slots.forEach((tile, i) => {
      if (tile && tile.level === 1) state.board[cityId as CityId][i] = null;
    });
  }
  for (const merchant of state.merchants) {
    merchant.beer = merchant.tiles.map((t) => t !== 'blank');
  }
  // Automa: remove tiles that cannot be built in the Rail Era from its mat
  const automaMat = state.players[1].mat;
  for (const [industry, track] of Object.entries(automaMat)) {
    track.forEach((count, i) => {
      if (count > 0 && !tileSpec(industry as never, i + 1).eras.includes('rail')) {
        track[i] = 0;
      }
    });
  }
  log(state, 'Canal Era ends: links and level-1 industries removed, merchant beer restocked.');
}

export function playerScoreSummary(state: GameState, player: PlayerId): { vp: number; income: number; money: number } {
  return { vp: state.players[player].vp, income: state.players[player].incomeSpace, money: state.players[player].money };
}
