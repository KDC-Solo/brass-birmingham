import type { CityId, LocationId } from '../engine/types';
import { CITIES, LINKS, MERCHANTS } from '../engine/data/board';
import { LAYOUT } from '../engine/data/layout';
import { AUTOMA, HUMAN, type GameState } from '../engine/state';

const INDUSTRY_ICON: Record<string, string> = {
  cotton: '🧵',
  goods: '📦',
  pottery: '🏺',
  coal: '⚫',
  iron: '🔩',
  brewery: '🍺',
};

interface Props {
  state: GameState;
  highlightCities?: Set<string>;
  highlightLinks?: Set<string>;
  onCityClick?: (city: CityId) => void;
  onLinkClick?: (linkId: string) => void;
}

function linkSegments(endpoints: readonly LocationId[]): [LocationId, LocationId][] {
  if (endpoints.length === 2) return [[endpoints[0], endpoints[1]]];
  return [
    [endpoints[0], endpoints[1]],
    [endpoints[1], endpoints[2]],
  ];
}

export function BoardMap({ state, highlightCities, highlightLinks, onCityClick, onLinkClick }: Props) {
  return (
    <svg viewBox="0 0 900 860" role="img" aria-label="Game board" data-testid="board">
      {LINKS.map((link) => {
        const owner = state.links[link.id];
        const highlighted = highlightLinks?.has(link.id);
        const stroke =
          owner === HUMAN ? 'var(--human)' : owner === AUTOMA ? 'var(--automa)' : highlighted ? 'var(--highlight)' : 'var(--border)';
        const width = owner != null ? 7 : highlighted ? 6 : 3;
        return (
          <g
            key={link.id}
            data-testid={`link-${link.id}`}
            style={{ cursor: highlighted && onLinkClick ? 'pointer' : 'default' }}
            onClick={() => highlighted && onLinkClick?.(link.id)}
          >
            {linkSegments(link.endpoints).map(([a, b], i) => (
              <line
                key={i}
                x1={LAYOUT[a].x}
                y1={LAYOUT[a].y}
                x2={LAYOUT[b].x}
                y2={LAYOUT[b].y}
                stroke={stroke}
                strokeWidth={width}
                strokeDasharray={link.canal && !link.rail ? '7 5' : link.rail && !link.canal ? '2 4' : undefined}
                strokeLinecap="round"
              />
            ))}
            {owner != null && (
              <circle
                cx={(LAYOUT[link.endpoints[0]].x + LAYOUT[link.endpoints[link.endpoints.length - 1]].x) / 2}
                cy={(LAYOUT[link.endpoints[0]].y + LAYOUT[link.endpoints[link.endpoints.length - 1]].y) / 2}
                r={7}
                fill={owner === HUMAN ? 'var(--human)' : 'var(--automa)'}
              />
            )}
          </g>
        );
      })}

      {Object.values(CITIES).map((city) => {
        const pos = LAYOUT[city.id];
        const slots = state.board[city.id];
        const w = city.isFarmBrewery ? 34 : Math.max(66, city.slots.length * 30 + 8);
        const h = city.isFarmBrewery ? 34 : 46;
        const highlighted = highlightCities?.has(city.id);
        return (
          <g
            key={city.id}
            data-testid={`city-${city.id}`}
            style={{ cursor: highlighted && onCityClick ? 'pointer' : 'default' }}
            onClick={() => highlighted && onCityClick?.(city.id)}
          >
            <rect
              x={pos.x - w / 2}
              y={pos.y - h / 2}
              width={w}
              height={h}
              rx={8}
              fill="var(--panel-2)"
              stroke={highlighted ? 'var(--highlight)' : 'var(--border)'}
              strokeWidth={highlighted ? 3 : 1.5}
            />
            <text x={pos.x} y={pos.y - h / 2 - 4} textAnchor="middle" fontSize={12} fill="var(--text)">
              {city.isFarmBrewery ? '🍺 farm' : city.name}
            </text>
            {!city.isFarmBrewery &&
              city.slots.map((allowed, i) => {
                const tile = slots[i];
                const sx = pos.x - w / 2 + 6 + i * 30;
                const sy = pos.y - 12;
                return (
                  <g key={i}>
                    <rect
                      x={sx}
                      y={sy}
                      width={26}
                      height={26}
                      rx={4}
                      fill={tile ? (tile.owner === HUMAN ? 'var(--human-bg)' : 'var(--automa-bg)') : 'var(--panel)'}
                      stroke={tile ? (tile.owner === HUMAN ? 'var(--human)' : 'var(--automa)') : 'var(--border)'}
                      strokeWidth={tile ? 2 : 1}
                      opacity={tile?.flipped ? 0.65 : 1}
                    />
                    <text x={sx + 13} y={sy + 15} textAnchor="middle" fontSize={tile ? 11 : 9} fill="var(--text)">
                      {tile ? `${INDUSTRY_ICON[tile.industry]}` : allowed.map((a) => INDUSTRY_ICON[a]).join('')}
                    </text>
                    {tile && (
                      <text x={sx + 21} y={sy + 25} textAnchor="middle" fontSize={8} fontWeight={700} fill="var(--text)">
                        {tile.level}
                      </text>
                    )}
                    {tile && tile.resources > 0 && (
                      <text x={sx + 5} y={sy + 25} textAnchor="middle" fontSize={8} fill="var(--text)">
                        {tile.resources}
                      </text>
                    )}
                  </g>
                );
              })}
            {city.isFarmBrewery && slots[0] && (
              <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize={12}>
                {INDUSTRY_ICON.brewery}
              </text>
            )}
          </g>
        );
      })}

      {Object.values(MERCHANTS).map((m) => {
        const pos = LAYOUT[m.id];
        const merchantState = state.merchants.find((s) => s.id === m.id);
        return (
          <g key={m.id} data-testid={`merchant-${m.id}`}>
            <circle cx={pos.x} cy={pos.y} r={26} fill="var(--panel-2)" stroke="var(--accent)" strokeWidth={2} />
            <text x={pos.x} y={pos.y - 30} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--accent)">
              {m.name}
            </text>
            {merchantState ? (
              <>
                <text x={pos.x} y={pos.y - 2} textAnchor="middle" fontSize={10} fill="var(--text)">
                  {merchantState.tiles.map((t) => (t === 'any' ? '✱' : t === 'blank' ? '—' : INDUSTRY_ICON[t])).join(' ')}
                </text>
                <text x={pos.x} y={pos.y + 13} textAnchor="middle" fontSize={10} fill="var(--text)">
                  {merchantState.beer.map((b) => (b ? '🍺' : '·')).join(' ')}
                </text>
              </>
            ) : (
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={10} fill="var(--muted)">
                unused
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
