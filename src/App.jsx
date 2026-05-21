import React, { useState, useEffect, useRef, useCallback } from 'react';
import MoleculeViewer from './components/MoleculeViewer.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import CycleOverview from './components/CycleOverview.jsx';
import StepControls, { StepPills } from './components/StepControls.jsx';
import FunctionalGroupTooltip from './components/FunctionalGroupTooltip.jsx';
import { steps } from './data/steps.js';

export default function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [hoverGroup, setHoverGroup] = useState(null);
  const [floatingLabels, setFloatingLabels] = useState([]);
  const floatIdRef = useRef(0);

  const handleStepChange = useCallback(
    (next) => {
      setPrevIndex(stepIndex);
      setStepIndex(next);

      // Spawn floating reaction labels — staggered to match the three-phase
      // molecule transition: outputs during EXIT, inputs during ENTER.
      const step = steps[next];
      const newLabels = [];
      const baseX = 50;
      const baseY = 50;
      step.outputs.forEach((t, i) => {
        newLabels.push({
          id: floatIdRef.current++,
          text: `→ ${t}`,
          kind: 'out',
          delay: 100 + i * 180,
          x: baseX + 14 - (i % 2) * 4,
          y: baseY + 10 + i * 22,
        });
      });
      step.inputs.forEach((t, i) => {
        newLabels.push({
          id: floatIdRef.current++,
          text: `+ ${t}`,
          kind: 'in',
          delay: 2000 + i * 180,
          x: baseX - 18 + (i % 2) * 4,
          y: baseY + 10 + i * 22,
        });
      });
      setFloatingLabels((prev) => [...prev, ...newLabels]);
      setTimeout(() => {
        setFloatingLabels((prev) => prev.filter((l) => !newLabels.some((n) => n.id === l.id)));
      }, 4200);
    },
    [stepIndex]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        handleStepChange(stepIndex === steps.length - 1 ? 0 : stepIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        handleStepChange(stepIndex === 0 ? steps.length - 1 : stepIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepIndex, handleStepChange]);

  const currentStep = steps[stepIndex];

  return (
    <div className="app">
      <header className="app-header">
        <div className="masthead">
          <div className="eyebrow">
            <span className="dot" />
            Tricarboxylic Acid Cycle
          </div>
          <h1 className="app-title">
            Krebs <span className="accent">Cycle</span>
          </h1>
          <div className="subtitle">
            An interactive walkthrough of the eight enzymatic transformations.
          </div>
        </div>
        <div className="stage-counter">
          <span className="stage-counter-label">Stage</span>
          <div className="stage-counter-value">
            <span>{stepIndex + 1}</span>
            <span className="of">/</span>
            <span className="total">{steps.length}</span>
          </div>
        </div>
      </header>

      <StepPills stepIndex={stepIndex} onStepChange={handleStepChange} />

      <div className="stage">
        <div className="stage-frame" />
        <MoleculeViewer
          prevIndex={prevIndex}
          stepIndex={stepIndex}
          onTransitionEnd={() => setPrevIndex(stepIndex)}
          onHoverGroup={setHoverGroup}
        />
        <CycleOverview stepIndex={stepIndex} onSelect={handleStepChange} />

        <div className="stage-caption" key={stepIndex}>
          <span>{currentStep.name}</span>
          <span className="formula">{currentStep.formula}</span>
        </div>

        {floatingLabels.map((l) => (
          <div
            key={l.id}
            className={`reaction-float ${l.kind}`}
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              animationDelay: `${l.delay ?? 0}ms`,
              opacity: 0,
            }}
          >
            {l.text}
          </div>
        ))}
      </div>

      <InfoPanel stepIndex={stepIndex} />

      <StepControls stepIndex={stepIndex} onStepChange={handleStepChange} />

      <FunctionalGroupTooltip hover={hoverGroup} />
    </div>
  );
}
