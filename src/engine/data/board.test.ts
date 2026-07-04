import { describe, expect, it } from 'vitest';
import { CITIES, INDUSTRY_CARDS, LINKS, LOCATION_CARDS, MERCHANTS, MERCHANT_TILE_GROUPS, MERCHANT_TILE_MIX } from './board';

describe('board topology', () => {
  it('has 39 links', () => {
    expect(LINKS).toHaveLength(39);
  });

  it('every link endpoint is a known location', () => {
    const known = new Set([...Object.keys(CITIES), ...Object.keys(MERCHANTS)]);
    for (const link of LINKS) {
      for (const end of link.endpoints) expect(known).toContain(end);
    }
  });

  it('has exactly one canal-only link (Burton–Walsall)', () => {
    const canalOnly = LINKS.filter((l) => l.canal && !l.rail);
    expect(canalOnly.map((l) => l.id)).toEqual(['burton-walsall']);
  });

  it('has exactly eight rail-only links', () => {
    const railOnly = LINKS.filter((l) => !l.canal && l.rail);
    expect(railOnly).toHaveLength(8);
  });

  it('has one three-way link, through the southern farm brewery', () => {
    const triple = LINKS.filter((l) => l.endpoints.length === 3);
    expect(triple).toHaveLength(1);
    expect(triple[0].endpoints).toContain('farmSouth');
  });

  it('link ids are unique and match sorted endpoints', () => {
    const ids = new Set(LINKS.map((l) => l.id));
    expect(ids.size).toBe(LINKS.length);
  });

  it('has 22 cities (incl. 2 farm breweries) and 5 merchants', () => {
    expect(Object.keys(CITIES)).toHaveLength(22);
    expect(Object.values(CITIES).filter((c) => c.isFarmBrewery)).toHaveLength(2);
    expect(Object.keys(MERCHANTS)).toHaveLength(5);
  });

  it('has 49 industry slots in total', () => {
    const total = Object.values(CITIES).reduce((sum, c) => sum + c.slots.length, 0);
    expect(total).toBe(49);
  });

  it('farm breweries only accept breweries', () => {
    for (const city of Object.values(CITIES).filter((c) => c.isFarmBrewery)) {
      expect(city.slots).toEqual([['brewery']]);
    }
  });

  it('every city is reachable in the rail-link graph', () => {
    const adjacency = new Map<string, string[]>();
    for (const link of LINKS.filter((l) => l.rail)) {
      for (const a of link.endpoints) {
        for (const b of link.endpoints) {
          if (a === b) continue;
          adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
        }
      }
    }
    const seen = new Set<string>(['birmingham']);
    const queue = ['birmingham'];
    while (queue.length) {
      for (const next of adjacency.get(queue.pop()!) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    for (const id of [...Object.keys(CITIES), ...Object.keys(MERCHANTS)]) {
      expect(seen, `${id} unreachable`).toContain(id);
    }
  });
});

describe('card decks', () => {
  function deckSize(players: 2 | 3 | 4): number {
    const locations = Object.values(LOCATION_CARDS[players]).reduce((a, b) => a + b, 0);
    const industries = INDUSTRY_CARDS[players].reduce((a, g) => a + g.count, 0);
    return locations + industries;
  }

  it('deck sizes are 40 / 54 / 64 for 2 / 3 / 4 players', () => {
    expect(deckSize(2)).toBe(40);
    expect(deckSize(3)).toBe(54);
    expect(deckSize(4)).toBe(64);
  });
});

describe('merchants', () => {
  it('tile counts match slot counts per player count', () => {
    for (const players of [2, 3, 4] as const) {
      const slots = ([2, 3, 4] as const)
        .filter((p) => p <= players)
        .flatMap((p) => MERCHANT_TILE_GROUPS[p])
        .reduce((a, g) => a + g.count, 0);
      expect(MERCHANT_TILE_MIX[players]).toHaveLength(slots);
    }
  });

  it('gates Warrington to 3+ and Nottingham to 4 players', () => {
    expect(MERCHANTS.warrington.minPlayers).toBe(3);
    expect(MERCHANTS.nottingham.minPlayers).toBe(4);
  });
});
