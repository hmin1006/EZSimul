import React from 'react';
import { steps } from '../data/steps.js';

export default function StepControls({ stepIndex, onStepChange }) {
  const max = steps.length - 1;
  const pct = (stepIndex / max) * 100;

  const go = (dir) => {
    let next = stepIndex + dir;
    if (next > max) next = 0;
    if (next < 0) next = max;
    onStepChange(next);
  };

  return (
    <div className="controls-bar">
      <button className="arrow-btn" onClick={() => go(-1)} aria-label="Previous step">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6 L9 12 L15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="slider-wrap">
        <div className="slider-ticks">
          {steps.map((s, i) => (
            <span key={s.id} className={`tick${i === stepIndex ? ' active' : ''}`}>
              {i + 1}
            </span>
          ))}
        </div>
        <input
          className="slider"
          type="range"
          min="0"
          max={max}
          step="1"
          value={stepIndex}
          onChange={(e) => onStepChange(Number(e.target.value))}
          style={{ '--pct': `${pct}%` }}
        />
      </div>

      <button className="arrow-btn" onClick={() => go(1)} aria-label="Next step">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 6 L15 12 L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export function StepPills({ stepIndex, onStepChange }) {
  return (
    <nav className="step-pills-row" aria-label="Cycle stages">
      {steps.map((s, i) => (
        <button
          key={s.id}
          className={`step-pill${i === stepIndex ? ' active' : ''}`}
          onClick={() => onStepChange(s.id)}
        >
          <span className="pill-num">{i + 1}</span>
          {s.name}
        </button>
      ))}
    </nav>
  );
}
