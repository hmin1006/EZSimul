import React, { useState, useEffect, useRef, useCallback } from 'react';
import MoleculeViewer from './components/MoleculeViewer.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import CycleOverview from './components/CycleOverview.jsx';
import StepControls, { StepPills } from './components/StepControls.jsx';
import FunctionalGroupTooltip from './components/FunctionalGroupTooltip.jsx';
import { pathways, pathwayOrder } from './data/pathways.js';

export default function App() {
  const [pathwayId, setPathwayId] = useState(pathwayOrder[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [hoverGroup, setHoverGroup] = useState(null);
  const [floatingLabels, setFloatingLabels] = useState([]);
  const floatIdRef = useRef(0);

  const pathway = pathways[pathwayId];
  const { steps } = pathway;

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
    [stepIndex, steps]
  );

  // Switching pathway resets to its first step and clears any in-flight labels.
  const handlePathwayChange = useCallback((id) => {
    if (id === pathwayId) return;
    setPathwayId(id);
    setStepIndex(0);
    setPrevIndex(0);
    setHoverGroup(null);
    setFloatingLabels([]);
  }, [pathwayId]);

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
  }, [stepIndex, steps, handleStepChange]);

  const currentStep = steps[stepIndex];

  return (
    <div className="app">
      <header className="app-header">
        <div className="masthead">
          <div className="eyebrow">
            <span className="dot" />
            {pathway.eyebrow}
          </div>
          <h1 className="app-title" key={pathwayId}>
            {pathway.title}<span className="accent">{pathway.titleAccent}</span>
          </h1>
          <div className="subtitle">{pathway.subtitle}</div>
        </div>

        <div className="header-right">
          <div className="pathway-switch" role="tablist" aria-label="Pathway">
            {pathwayOrder.map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={id === pathwayId}
                className={`pathway-tab${id === pathwayId ? ' active' : ''}`}
                onClick={() => handlePathwayChange(id)}
              >
                {pathways[id].label}
              </button>
            ))}
          </div>
          <div className="stage-counter">
            <span className="stage-counter-label">Stage</span>
            <div className="stage-counter-value">
              <span>{stepIndex + 1}</span>
              <span className="of">/</span>
              <span className="total">{steps.length}</span>
            </div>
          </div>
        </div>
      </header>

      <StepPills steps={steps} stepIndex={stepIndex} onStepChange={handleStepChange} />

      <div className="stage">
        <div className="stage-frame" />
        <MoleculeViewer
          key={pathwayId}
          molecules={pathway.molecules}
          highlights={pathway.highlights}
          cameraZ={pathway.cameraZ}
          prevIndex={prevIndex}
          stepIndex={stepIndex}
          onTransitionEnd={() => setPrevIndex(stepIndex)}
          onHoverGroup={setHoverGroup}
        />
        <CycleOverview pathway={pathway} stepIndex={stepIndex} onSelect={handleStepChange} />

        <div className="stage-caption" key={`${pathwayId}-${stepIndex}`}>
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

      <InfoPanel steps={steps} stepIndex={stepIndex} />

      <StepControls steps={steps} stepIndex={stepIndex} onStepChange={handleStepChange} />

      <FunctionalGroupTooltip hover={hoverGroup} />
    </div>
  );
}
