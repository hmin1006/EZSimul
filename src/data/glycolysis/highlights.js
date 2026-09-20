// Glycolysis: atom keys of the functional group that changes at each step.
// Same convention as the Krebs highlights — the renderer paints a unified
// yellow shape behind these atoms (and along bonds between them).

const P = (id) => [`${id}_P`, `${id}_O1`, `${id}_O2`, `${id}_O3`];

export const HIGHLIGHTS = {
  // 0 — Glucose: the C6 hydroxyl that hexokinase is about to phosphorylate.
  0: ['c6', 'c6_oh', 'c6_oh_H'],

  // 1 — G6P: the new C6 phosphate ester.
  1: ['c6', 'c6_oh', ...P('pA')],

  // 2 — F6P: the aldose→ketose swap at C1/C2.
  2: ['c1', 'c1_O', 'c1_O_H', 'c2', 'c2_oh'],

  // 3 — F1,6BP: the new C1 phosphate ester.
  3: ['c1', 'c1_O', ...P('pB')],

  // 4 — DHAP + G3P: the cleavage site (C3 gains an H, C4 becomes an aldehyde).
  4: ['c3', 'c3_oh', 'c3_oh_H', 'c4', 'c4_oh', 'c4_H'],

  // 5 — 2× G3P: the DHAP→G3P conversion on the top row.
  5: ['c3', 'c3_oh', 'c3_H', 'c2', 'c2_oh', 'c2_oh_H'],

  // 6 — 2× 1,3-BPG: both new acyl phosphates.
  6: ['c3', 'c3_oh', 'c3_pO', ...P('pC'), 'c4', 'c4_oh', 'c4_pO', ...P('pD')],

  // 7 — 2× 3-PG: both carboxyls left behind after phosphoryl transfer.
  7: ['c3', 'c3_oh', 'c3_pO', 'c3_pO_H', 'c4', 'c4_oh', 'c4_pO', 'c4_pO_H'],

  // 8 — 2× 2-PG: the relocated phosphates on C2.
  8: ['c2', 'c2_oh', ...P('pB'), 'c5', 'c5_oh', ...P('pA')],

  // 9 — 2× PEP: the new C=C double bonds.
  9: ['c2', 'c1', 'c5', 'c6'],

  // 10 — 2× Pyruvate: the ketones formed by tautomerisation.
  10: ['c2', 'c2_oh', 'c5', 'c5_oh'],
};
