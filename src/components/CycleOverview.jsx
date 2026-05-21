import React from 'react';
import { steps } from '../data/steps.js';

// 8 stations around a ring. Step 8 (regenerated OAA) collapses onto station 0
// — the loop closes there.
const CANONICAL = [0, 1, 2, 3, 4, 5, 6, 7];

export default function CycleOverview({ stepIndex, onSelect }) {
  const activePos = stepIndex === 8 ? 0 : stepIndex;
  const size = 168;
  const center = size / 2;
  const radius = size * 0.32;

  const pos = (i) => {
    const theta = -Math.PI / 2 + (i / CANONICAL.length) * Math.PI * 2;
    return [center + Math.cos(theta) * radius, center + Math.sin(theta) * radius];
  };

  // Build SVG arc path connecting consecutive stations (slight curve via quadratic).
  // For a smooth ring effect we just connect dots with straight lines — clean & modern.
  const ringPath = CANONICAL.map((_, i) => {
    const [x, y] = pos(i);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ') + ' Z';

  return (
    <div className="cycle-overview">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer ring — single subtle line */}
        <circle
          cx={center} cy={center} r={radius + 14}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.7"
        />

        {/* Inner connecting polygon — light outline */}
        <path
          d={ringPath}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Active arc segment — solid emerald from active to next */}
        {(() => {
          const [x1, y1] = pos(activePos);
          const [x2, y2] = pos((activePos + 1) % CANONICAL.length);
          return (
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })()}

        {/* Stations */}
        {CANONICAL.map((stepId, i) => {
          const [x, y] = pos(i);
          const active = i === activePos;
          const step = steps[stepId];
          return (
            <g
              key={i}
              className="cycle-dot"
              onClick={() => onSelect(stepId)}
            >
              {active && (
                <circle
                  cx={x} cy={y} r={9}
                  fill="var(--accent-soft)"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
              )}
              <circle
                cx={x} cy={y}
                r={active ? 4 : 2.5}
                fill={active ? 'var(--accent)' : 'var(--text-muted)'}
              />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                className={`cycle-dot-label${active ? ' active' : ''}`}
              >
                {step.shortName}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fill="var(--text-faint)"
          style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 }}
        >
          TCA
        </text>
        <text
          x={center}
          y={center + 13}
          textAnchor="middle"
          fill="var(--accent)"
          style={{ fontSize: 16, fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 600, letterSpacing: '-0.03em' }}
        >
          {stepIndex === 8 ? '↺' : stepIndex + 1}
        </text>
      </svg>
    </div>
  );
}
