import type { CityId, LocationId, PlayerId } from './types';
import { CITIES, LINKS, isMerchant } from './data/board';
import type { GameState } from './state';

/** Locations joined to `from` by built link tiles (any owner). */
function neighbors(state: GameState, from: LocationId): LocationId[] {
  const result: LocationId[] = [];
  for (const link of LINKS) {
    if (state.links[link.id] == null) continue;
    if (!link.endpoints.includes(from)) continue;
    for (const end of link.endpoints) if (end !== from) result.push(end);
  }
  return result;
}

/** All locations connected to `from` (via built links, any owner). Includes `from`. */
export function connectedComponent(state: GameState, from: LocationId): Set<LocationId> {
  const seen = new Set<LocationId>([from]);
  const queue: LocationId[] = [from];
  while (queue.length) {
    for (const next of neighbors(state, queue.pop()!)) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

export function areConnected(state: GameState, a: LocationId, b: LocationId): boolean {
  return connectedComponent(state, a).has(b);
}

/** Link-tile distances from a location (for closest-coal-mine resolution). */
export function distancesFrom(state: GameState, from: LocationId): Map<LocationId, number> {
  const dist = new Map<LocationId, number>([[from, 0]]);
  const queue: LocationId[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    for (const next of neighbors(state, cur)) {
      if (!dist.has(next)) {
        dist.set(next, d + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}

/** Locations in a player's network (industry tile there, or adjacent link owned). */
export function playerNetwork(state: GameState, player: PlayerId): Set<LocationId> {
  const network = new Set<LocationId>();
  for (const [cityId, slots] of Object.entries(state.board)) {
    if (slots.some((t) => t?.owner === player)) network.add(cityId as CityId);
  }
  for (const link of LINKS) {
    if (state.links[link.id] === player) {
      for (const end of link.endpoints) network.add(end);
    }
  }
  return network;
}

/** True if the player has no tiles at all (may act anywhere). */
export function hasNoNetwork(state: GameState, player: PlayerId): boolean {
  return playerNetwork(state, player).size === 0;
}

/** Whether a location is connected to any merchant location (market access). */
export function connectedToMarket(state: GameState, from: LocationId): boolean {
  const component = connectedComponent(state, from);
  for (const id of component) if (isMerchant(id)) return true;
  return false;
}

/** Merchants connected to a location. */
export function connectedMerchants(state: GameState, from: LocationId): LocationId[] {
  return [...connectedComponent(state, from)].filter((id) => isMerchant(id));
}

/** Unbuilt link specs placeable in the current era. */
export function openLinks(state: GameState): typeof LINKS {
  return LINKS.filter((l) => state.links[l.id] == null && (state.era === 'canal' ? l.canal : l.rail));
}

export function cityHasFreeSlotFor(state: GameState, city: CityId): number {
  return state.board[city].filter((t, i) => t === null && CITIES[city].slots[i] !== undefined).length;
}
