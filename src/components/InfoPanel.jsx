import React from 'react';
import { steps } from '../data/steps.js';

export default function InfoPanel({ stepIndex }) {
  const step = steps[stepIndex];
  if (!step) return null;

  const carbonsFrom = step.carbonsFrom;
  const carbonsTo = step.carbons;
  const lostCarbon = carbonsFrom != null && carbonsTo < carbonsFrom;
  const gainedCarbon = carbonsFrom != null && carbonsTo > carbonsFrom;

  return (
    <aside className="info-panel" key={stepIndex}>
      <div className="panel-section">
        <div className="panel-eyebrow">Stage {stepIndex + 1}</div>
        <h2 className="panel-molecule-name">{step.name}</h2>
        <div className="panel-formula">{step.formula}</div>
      </div>

      <div className="panel-divider" />

      {step.enzyme && (
        <div className="panel-section">
          <div className="panel-label">Enzyme</div>
          <div className="panel-enzyme">{step.enzyme}</div>
        </div>
      )}

      <div className="panel-section">
        <div className="panel-label">Reaction</div>
        <div className="panel-reaction">{step.reaction}</div>
      </div>

      {step.inputs.length > 0 && (
        <div className="panel-section">
          <div className="panel-label">Reagents in</div>
          <div className="tag-group">
            {step.inputs.map((t) => (
              <span key={t} className="tag in">+ {t}</span>
            ))}
          </div>
        </div>
      )}

      {step.outputs.length > 0 && (
        <div className="panel-section">
          <div className="panel-label">Products out</div>
          <div className="tag-group">
            {step.outputs.map((t) => (
              <span key={t} className="tag out">→ {t}</span>
            ))}
          </div>
        </div>
      )}

      {step.notes.length > 0 && (
        <div className="panel-section">
          <div className="panel-label">Key notes</div>
          <div className="tag-group">
            {step.notes.map((t) => (
              <span key={t} className="tag note">{t}</span>
            ))}
          </div>
        </div>
      )}

      {step.energy && (
        <div className="panel-section">
          <div className="panel-label">Thermodynamics</div>
          <div className="energy-row">
            <span className={`energy-value ${step.energy.favorable ? 'favorable' : 'unfavorable'}`}>
              ΔG°′ {step.energy.dG > 0 ? '+' : ''}{step.energy.dG} kJ/mol
            </span>
          </div>
          <div className="energy-note">{step.energy.note}</div>
        </div>
      )}

      <div className="panel-section">
        <div className="panel-label">Carbon count</div>
        <div className="carbon-count">
          {carbonsFrom != null ? (
            <>
              <span className="c-badge">{carbonsFrom}C</span>
              <span className="c-arrow">→</span>
              <span className={`c-badge ${lostCarbon ? 'lost' : ''}`}>{carbonsTo}C</span>
              {lostCarbon && (
                <span style={{ color: 'var(--warn)', fontSize: 13, fontWeight: 500 }}>
                  − CO₂
                </span>
              )}
              {gainedCarbon && (
                <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 500 }}>
                  + acetyl (2C)
                </span>
              )}
            </>
          ) : (
            <span className="c-badge">{carbonsTo}C</span>
          )}
        </div>
      </div>

      <div className="panel-divider" />

      <div className="panel-section">
        <div className="panel-label">Description</div>
        <div className="panel-description">{step.description}</div>
      </div>
    </aside>
  );
}
