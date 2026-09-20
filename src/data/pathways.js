// Pathway registry. Each pathway bundles its molecular states, step metadata
// and highlight sets, plus a little presentation config the UI needs:
//
//   layout    'ring'   — the last step regenerates the first (Krebs); the
//                        overview draws stations on a circle and the final
//                        step maps back onto station 0
//             'linear' — a start-to-finish track (glycolysis)
//   cameraZ   default camera distance; wider molecules need to sit further back
//   title / titleAccent / eyebrow / subtitle — header copy

import { molecules as krebsMolecules } from './molecules.js';
import { steps as krebsSteps } from './steps.js';
import { HIGHLIGHTS as krebsHighlights } from './highlights.js';

import { molecules as glycolysisMolecules } from './glycolysis/molecules.js';
import { steps as glycolysisSteps } from './glycolysis/steps.js';
import { HIGHLIGHTS as glycolysisHighlights } from './glycolysis/highlights.js';

export const pathways = {
  glycolysis: {
    id: 'glycolysis',
    label: 'Glycolysis',
    layout: 'linear',
    cameraZ: 16,
    eyebrow: 'Embden–Meyerhof–Parnas Pathway',
    title: 'Glyco',
    titleAccent: 'lysis',
    subtitle: 'Ten enzymatic steps that split one glucose into two pyruvate, netting 2 ATP and 2 NADH.',
    molecules: glycolysisMolecules,
    steps: glycolysisSteps,
    highlights: glycolysisHighlights,
  },
  krebs: {
    id: 'krebs',
    label: 'Krebs Cycle',
    layout: 'ring',
    cameraZ: 11,
    eyebrow: 'Tricarboxylic Acid Cycle',
    title: 'Krebs',
    titleAccent: 'Cycle',
    subtitle: 'An interactive walkthrough of the eight enzymatic transformations that regenerate oxaloacetate.',
    molecules: krebsMolecules,
    steps: krebsSteps,
    highlights: krebsHighlights,
  },
};

export const pathwayOrder = ['glycolysis', 'krebs'];
