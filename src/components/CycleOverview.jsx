import React from 'react';

// Pathway mini-map. Two layouts:
//   ring   — stations on a circle; the final step (which regenerates the
//            first molecule) collapses onto station 0 so the loop closes.
//   linear — stations along a horizontal track with a progress line.
export default function CycleOverview({ pathway, stepIndex, onSelect }) {
  const { steps, layout } = pathway;
  return layout === 'ring'
    ? <RingOverview steps={steps} stepIndex={stepIndex} onSelect={onSelect} />
    : <LinearOverview steps={steps} stepIndex={stepIndex} onSelect={onSelect} />;
}

// ------------------------------------------------------------------
// Ring
// ------------------------------------------------------------------
function RingOverview({ steps, stepIndex, onSelect }) {
  const stations = steps.length - 1;                 // last step == station 0
  const activePos = stepIndex === steps.length - 1 ? 0 : stepIndex;
  const size = 168;
  const center = size / 2;
  const radius = size * 0.32;

  const pos = (i) => {
    const theta = -Math.PI / 2 + (i / stations) * Math.PI * 2;
    return [center + Math.cos(theta) * radius, center + Math.sin(theta) * radius];
  };

  const ringPath = Array.from({ length: stations }, (_, i) => {
    const [x, y] = pos(i);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ') + ' Z';

  const [ax1, ay1] = pos(activePos);
  const [ax2, ay2] = pos((activePos + 1) % stations);

  return (
    <div className="cycle-overview ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius + 14} fill="none"
          stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="2 4" opacity="0.7" />
        <path d={ringPath} fill="none" stroke="var(--border-strong)" strokeWidth="1" opacity="0.5" />
        <line x1={ax1} y1={ay1} x2={ax2} y2={ay2}
          stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

        {Array.from({ length: stations }, (_, i) => {
          const [x, y] = pos(i);
          const active = i === activePos;
          return (
            <g key={i} className="cycle-dot" onClick={() => onSelect(i)}>
              {active && (
                <circle cx={x} cy={y} r={9} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" />
              )}
              <circle cx={x} cy={y} r={active ? 4 : 2.5} fill={active ? 'var(--accent)' : 'var(--text-muted)'} />
              <text x={x} y={y - 12} textAnchor="middle" className={`cycle-dot-label${active ? ' active' : ''}`}>
                {steps[i].shortName}
              </text>
            </g>
          );
        })}

        <text x={center} y={center - 4} textAnchor="middle" fill="var(--text-faint)"
          style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 }}>
          TCA
        </text>
        <text x={center} y={center + 13} textAnchor="middle" fill="var(--accent)"
          style={{ fontSize: 16, fontFamily: 'Bricolage Grotesque, sans-serif', fontWeight: 600, letterSpacing: '-0.03em' }}>
          {stepIndex === steps.length - 1 ? '↺' : stepIndex + 1}
        </text>
      </svg>
    </div>
  );
}

// ------------------------------------------------------------------
// Linear track
// ------------------------------------------------------------------
function LinearOverview({ steps, stepIndex, onSelect }) {
  const n = steps.length;
  const width = 300;
  const height = 64;
  const padX = 16;
  const trackY = 40;
  const x = (i) => padX + (i / (n - 1)) * (width - padX * 2);

  return (
    <div className="cycle-overview linear">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* full track */}
        <line x1={x(0)} y1={trackY} x2={x(n - 1)} y2={trackY}
          stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" />
        {/* progress so far */}
        <line x1={x(0)} y1={trackY} x2={x(stepIndex)} y2={trackY}
          stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />

        {steps.map((s, i) => {
          const cx = x(i);
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <g key={i} className="cycle-dot" onClick={() => onSelect(i)}>
              {active && (
                <circle cx={cx} cy={trackY} r={9} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" />
              )}
              <circle cx={cx} cy={trackY} r={active ? 4 : 2.5}
                fill={active || done ? 'var(--accent)' : 'var(--text-muted)'} />
              {/* 11 stations are too dense to label them all — show the active
                  one, plus the two endpoints when they aren't right next to it */}
              {(active || ((i === 0 || i === n - 1) && Math.abs(i - stepIndex) > 1)) && (
                <text x={cx} y={trackY - 14} textAnchor="middle"
                  className={`cycle-dot-label${active ? ' active' : ''}`}>
                  {s.shortName}
                </text>
              )}
            </g>
          );
        })}

        <text x={x(0)} y={height - 2} fill="var(--text-faint)"
          style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500 }}>
          Step {stepIndex + 1} / {n}
        </text>
      </svg>
    </div>
  );
}
