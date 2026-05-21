// Molecule structural data for each of the 9 states (steps 0..8) of the Krebs cycle.
//
// Coordinates use a simple 2D zigzag in the X-Y plane with slight Z perturbation to give
// the 3D rendering a bit of depth.
//
// Each atom has a `key` — this is a canonical identifier that links the SAME atom across
// steps. When transitioning from step N to step N+1, atoms with the same `key` tween
// their positions smoothly; atoms only present in one state fade in/out.
//
// Element codes:
//   C  — carbon (small grey junction dot, no label)
//   O  — oxygen (red sphere, labeled "O")
//   S  — sulfur (gold sphere, labeled "S")
//   H  — hydrogen (light small sphere, labeled "H") — only used for hydroxyl hydrogens
//   L  — "label" pseudo-atom for non-atom group text (e.g. "CoA")

// ------------------------------------------------------------------
// Shared backbone coordinates
// ------------------------------------------------------------------
const B4 = [
  [-2.25,  0.30, 0],
  [-0.75, -0.30, 0],
  [ 0.75,  0.30, 0],
  [ 2.25, -0.30, 0],
];
const B5 = [
  [-3.00, -0.30, 0],
  [-1.50,  0.30, 0],
  [ 0.00, -0.30, 0],
  [ 1.50,  0.30, 0],
  [ 3.00, -0.30, 0],
];
const B6main = [
  [-3.00, -0.30, 0.1],
  [-1.50,  0.30, 0.0],
  [ 0.00, -0.30, 0.0],
  [ 1.50,  0.30, 0.0],
  [ 3.00, -0.30, 0.1],
];
const B6branch = [0.00, -1.70, 0.0];

// ------------------------------------------------------------------
// Vector helpers
// ------------------------------------------------------------------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ------------------------------------------------------------------
// Hydroxyl group helper — generates an O atom + H atom + the two bonds
// connecting parent→O and O→H. Parent can be a carbon (for -OH groups on
// either carboxyl or hydroxyl-bearing carbons).
//
//   parentKey   : key of the atom the OH is attached to (usually a carbon)
//   parentPos   : [x,y,z] of that parent atom (used to position O)
//   dir         : direction vector from parent to O (so oPos = parent + dir)
//   keyO        : atom key for the oxygen
//   group/role  : hover tooltip metadata for the oxygen
//
// The H atom is placed further outward along the same direction.
// ------------------------------------------------------------------
const OH_EXTEND = 0.75;
function hydroxyl(parentKey, parentPos, dir, keyO, group, role) {
  const oPos = add(parentPos, dir);
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  const ux = dir[0] / len, uy = dir[1] / len, uz = dir[2] / len;
  const hPos = [oPos[0] + ux * OH_EXTEND, oPos[1] + uy * OH_EXTEND, oPos[2] + uz * OH_EXTEND];
  const keyH = `${keyO}_H`;
  return {
    atoms: [
      { key: keyO, el: 'O', pos: oPos, group, role },
      { key: keyH, el: 'H', pos: hPos },
    ],
    bonds: [
      { a: parentKey, b: keyO, order: 1 },
      { a: keyO, b: keyH, order: 1 },
    ],
  };
}

// ------------------------------------------------------------------
// Oxaloacetate (step 0) — HOOC-C(=O)-CH2-COOH
// Uses the same cit_c*-style keys as the rest of the cycle so atoms persist
// smoothly through transitions.
// ------------------------------------------------------------------
function oxaloacetate() {
  const Loh = hydroxyl('cit_c2', B4[0], [-1.00, -0.55, 0], 'suc_Lcarb_oh',
    'carboxyl', 'Left carboxylic acid hydroxyl');
  const Roh = hydroxyl('cit_c5', B4[3], [ 1.00,  0.55, 0], 'suc_Rcarb_oh',
    'carboxyl', 'Right carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c2', el: 'C', pos: B4[0] },
    { key: 'cit_c3', el: 'C', pos: B4[1] },   // ketone C
    { key: 'cit_c4', el: 'C', pos: B4[2] },
    { key: 'cit_c5', el: 'C', pos: B4[3] },
    { key: 'suc_Lcarb_carbO', el: 'O', pos: add(B4[0], [-0.20, 1.00, 0]),
      group: 'carboxyl', role: 'Left carboxylate carbonyl oxygen' },
    { key: 'oaa_c3_ketO', el: 'O', pos: add(B4[1], [0.00, -1.20, 0]),
      group: 'ketone', role: 'α-keto carbonyl — electrophilic site that Acetyl-CoA attacks next step' },
    { key: 'suc_Rcarb_carbO', el: 'O', pos: add(B4[3], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'Right carboxylate carbonyl oxygen' },
    ...Loh.atoms, ...Roh.atoms,
  ];
  const bonds = [
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c2', b: 'suc_Lcarb_carbO', order: 2 },
    { a: 'cit_c3', b: 'oaa_c3_ketO', order: 2 },
    { a: 'cit_c5', b: 'suc_Rcarb_carbO', order: 2 },
    ...Loh.bonds, ...Roh.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// Citrate (step 1) — HOOC-CH2-C(OH)(COOH)-CH2-COOH
// ------------------------------------------------------------------
function citrate() {
  // Left COOH (c1) — carbonyl points DOWN, hydroxyl points UP, matching α-KG.
  const ohC1 = hydroxyl('cit_c1', B6main[0], [-1.00,  0.55, 0], 'cit_c1_oh',
    'carboxyl', 'C1 carboxylic acid hydroxyl');
  const ohC5 = hydroxyl('cit_c5', B6main[4], [ 1.00,  0.55, 0], 'cit_c5_oh',
    'carboxyl', 'C5 carboxylic acid hydroxyl');
  const ohC3 = hydroxyl('cit_c3', B6main[2], [ 0.00,  1.10, 0], 'cit_c3_oh',
    'hydroxyl', 'Tertiary hydroxyl formed during Acetyl-CoA condensation');
  const ohC6 = hydroxyl('cit_c6', B6branch, [ 0.80, -0.70, 0], 'cit_c6_oh',
    'carboxyl', 'Branch carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c1', el: 'C', pos: B6main[0] },
    { key: 'cit_c2', el: 'C', pos: B6main[1] },
    { key: 'cit_c3', el: 'C', pos: B6main[2] },
    { key: 'cit_c4', el: 'C', pos: B6main[3] },
    { key: 'cit_c5', el: 'C', pos: B6main[4] },
    { key: 'cit_c6', el: 'C', pos: B6branch },
    { key: 'cit_c1_carbO', el: 'O', pos: add(B6main[0], [-0.20, -1.00, 0]),
      group: 'carboxyl', role: 'C1 carboxylate carbonyl oxygen' },
    { key: 'cit_c5_carbO', el: 'O', pos: add(B6main[4], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'C5 carboxylate carbonyl oxygen' },
    { key: 'cit_c6_carbO', el: 'O', pos: add(B6branch, [-0.80, -0.70, 0]),
      group: 'carboxyl', role: 'Branch carboxylate carbonyl' },
    ...ohC1.atoms, ...ohC5.atoms, ...ohC3.atoms, ...ohC6.atoms,
  ];
  const bonds = [
    { a: 'cit_c1', b: 'cit_c2', order: 1 },
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c3', b: 'cit_c6', order: 1 },
    { a: 'cit_c1', b: 'cit_c1_carbO', order: 2 },
    { a: 'cit_c5', b: 'cit_c5_carbO', order: 2 },
    { a: 'cit_c6', b: 'cit_c6_carbO', order: 2 },
    ...ohC1.bonds, ...ohC5.bonds, ...ohC3.bonds, ...ohC6.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// Isocitrate (step 2) — hydroxyl migrated from c3 to c4
// ------------------------------------------------------------------
function isocitrate() {
  // Left COOH (c1) — same orientation as α-KG: carbonyl down, hydroxyl up.
  const ohC1 = hydroxyl('cit_c1', B6main[0], [-1.00,  0.55, 0], 'cit_c1_oh',
    'carboxyl', 'C1 carboxylic acid hydroxyl');
  const ohC5 = hydroxyl('cit_c5', B6main[4], [ 1.00,  0.55, 0], 'cit_c5_oh',
    'carboxyl', 'C5 carboxylic acid hydroxyl');
  const ohC4 = hydroxyl('cit_c4', B6main[3], [ 0.00,  1.10, 0], 'iso_c4_oh',
    'hydroxyl', 'Secondary hydroxyl repositioned by aconitase');
  const ohC6 = hydroxyl('cit_c6', B6branch, [ 0.80, -0.70, 0], 'cit_c6_oh',
    'carboxyl', 'Branch carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c1', el: 'C', pos: B6main[0] },
    { key: 'cit_c2', el: 'C', pos: B6main[1] },
    { key: 'cit_c3', el: 'C', pos: B6main[2] },
    { key: 'cit_c4', el: 'C', pos: B6main[3] },
    { key: 'cit_c5', el: 'C', pos: B6main[4] },
    { key: 'cit_c6', el: 'C', pos: B6branch },
    { key: 'cit_c1_carbO', el: 'O', pos: add(B6main[0], [-0.20, -1.00, 0]),
      group: 'carboxyl', role: 'C1 carboxylate carbonyl' },
    { key: 'cit_c5_carbO', el: 'O', pos: add(B6main[4], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'C5 carboxylate carbonyl' },
    { key: 'cit_c6_carbO', el: 'O', pos: add(B6branch, [-0.80, -0.70, 0]),
      group: 'carboxyl', role: 'Branch carboxylate carbonyl' },
    ...ohC1.atoms, ...ohC5.atoms, ...ohC4.atoms, ...ohC6.atoms,
  ];
  const bonds = [
    { a: 'cit_c1', b: 'cit_c2', order: 1 },
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c3', b: 'cit_c6', order: 1 },
    { a: 'cit_c1', b: 'cit_c1_carbO', order: 2 },
    { a: 'cit_c5', b: 'cit_c5_carbO', order: 2 },
    { a: 'cit_c6', b: 'cit_c6_carbO', order: 2 },
    ...ohC1.bonds, ...ohC5.bonds, ...ohC4.bonds, ...ohC6.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// α-Ketoglutarate (step 3) — HOOC-C(=O)-CH2-CH2-COOH (5C linear)
// Branch carboxyl leaves as CO2 (cit_c6 gone); cit_c3 gains ketone.
// ------------------------------------------------------------------
function alphaKG() {
  const ohC1 = hydroxyl('cit_c1', B5[0], [-1.00,  0.55, 0], 'cit_c1_oh',
    'carboxyl', 'C1 carboxylic acid hydroxyl');
  const ohC5 = hydroxyl('cit_c5', B5[4], [ 1.00,  0.55, 0], 'cit_c5_oh',
    'carboxyl', 'C5 carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c1', el: 'C', pos: B5[0] },
    { key: 'cit_c2', el: 'C', pos: B5[1] },
    { key: 'cit_c3', el: 'C', pos: B5[2] },
    { key: 'cit_c4', el: 'C', pos: B5[3] },
    { key: 'cit_c5', el: 'C', pos: B5[4] },
    { key: 'cit_c1_carbO', el: 'O', pos: add(B5[0], [-0.20, -1.05, 0]),
      group: 'carboxyl', role: 'C1 carboxylate carbonyl' },
    { key: 'akg_c3_ketO', el: 'O', pos: add(B5[2], [0.00, -1.20, 0]),
      group: 'ketone', role: 'α-keto carbonyl formed after loss of branch carboxyl as CO₂' },
    { key: 'cit_c5_carbO', el: 'O', pos: add(B5[4], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'C5 carboxylate carbonyl' },
    ...ohC1.atoms, ...ohC5.atoms,
  ];
  const bonds = [
    { a: 'cit_c1', b: 'cit_c2', order: 1 },
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c1', b: 'cit_c1_carbO', order: 2 },
    { a: 'cit_c3', b: 'akg_c3_ketO', order: 2 },
    { a: 'cit_c5', b: 'cit_c5_carbO', order: 2 },
    ...ohC1.bonds, ...ohC5.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// Succinyl-CoA (step 4) — HOOC-CH2-CH2-C(=O)-S-CoA  (4C)
// cit_c1 leaves as CO2; thioester + CoA append on cit_c5.
// ------------------------------------------------------------------
function succinylCoA() {
  const Loh = hydroxyl('cit_c2', B4[0], [-1.00, -0.55, 0], 'suc_Lcarb_oh',
    'carboxyl', 'Carboxylic acid hydroxyl on the succinyl moiety');

  const atoms = [
    { key: 'cit_c2', el: 'C', pos: B4[0] },
    { key: 'cit_c3', el: 'C', pos: B4[1] },
    { key: 'cit_c4', el: 'C', pos: B4[2] },
    { key: 'cit_c5', el: 'C', pos: B4[3] },    // thioester C
    { key: 'suc_Lcarb_carbO', el: 'O', pos: add(B4[0], [-0.20, 1.00, 0]),
      group: 'carboxyl', role: 'Free carboxylate carbonyl on the succinyl moiety' },
    { key: 'scoa_ketO', el: 'O', pos: add(B4[3], [0.20, -1.05, 0]),
      group: 'thioester', role: 'Thioester carbonyl — high-energy bond that drives GTP synthesis' },
    { key: 'scoa_S', el: 'S', pos: add(B4[3], [1.05, 0.55, 0]),
      group: 'thioester', role: 'Thioester sulfur linking to Coenzyme A' },
    { key: 'scoa_CoA', el: 'L', label: 'CoA', color: '#e4c78a', pos: add(B4[3], [2.15, 1.10, 0]),
      group: 'CoA', role: 'Coenzyme A — released next step via substrate-level phosphorylation' },
    ...Loh.atoms,
  ];
  const bonds = [
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c2', b: 'suc_Lcarb_carbO', order: 2 },
    { a: 'cit_c5', b: 'scoa_ketO', order: 2 },
    { a: 'cit_c5', b: 'scoa_S', order: 1 },
    { a: 'scoa_S', b: 'scoa_CoA', order: 1 },
    ...Loh.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// Succinate (step 5) — HOOC-CH2-CH2-COOH  (4C, symmetric)
// ------------------------------------------------------------------
function succinate() {
  const Loh = hydroxyl('cit_c2', B4[0], [-1.00, -0.55, 0], 'suc_Lcarb_oh',
    'carboxyl', 'Left carboxylic acid hydroxyl');
  const Roh = hydroxyl('cit_c5', B4[3], [ 1.00,  0.55, 0], 'suc_Rcarb_oh',
    'carboxyl', 'Right carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c2', el: 'C', pos: B4[0] },
    { key: 'cit_c3', el: 'C', pos: B4[1] },
    { key: 'cit_c4', el: 'C', pos: B4[2] },
    { key: 'cit_c5', el: 'C', pos: B4[3] },
    { key: 'suc_Lcarb_carbO', el: 'O', pos: add(B4[0], [-0.20, 1.00, 0]),
      group: 'carboxyl', role: 'Left carboxylate carbonyl' },
    { key: 'suc_Rcarb_carbO', el: 'O', pos: add(B4[3], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'Right carboxylate carbonyl' },
    ...Loh.atoms, ...Roh.atoms,
  ];
  const bonds = [
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c2', b: 'suc_Lcarb_carbO', order: 2 },
    { a: 'cit_c5', b: 'suc_Rcarb_carbO', order: 2 },
    ...Loh.bonds, ...Roh.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// Fumarate (step 6) — HOOC-CH=CH-COOH (trans)
// ------------------------------------------------------------------
function fumarate() {
  const Loh = hydroxyl('cit_c2', B4[0], [-1.00, -0.55, 0], 'suc_Lcarb_oh',
    'carboxyl', 'Left carboxylic acid hydroxyl');
  const Roh = hydroxyl('cit_c5', B4[3], [ 1.00,  0.55, 0], 'suc_Rcarb_oh',
    'carboxyl', 'Right carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c2', el: 'C', pos: B4[0] },
    { key: 'cit_c3', el: 'C', pos: B4[1] },
    { key: 'cit_c4', el: 'C', pos: B4[2] },
    { key: 'cit_c5', el: 'C', pos: B4[3] },
    { key: 'suc_Lcarb_carbO', el: 'O', pos: add(B4[0], [-0.20, 1.00, 0]),
      group: 'carboxyl', role: 'Left carboxylate carbonyl' },
    { key: 'suc_Rcarb_carbO', el: 'O', pos: add(B4[3], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'Right carboxylate carbonyl' },
    ...Loh.atoms, ...Roh.atoms,
  ];
  const bonds = [
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 2 },   // trans C=C
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c2', b: 'suc_Lcarb_carbO', order: 2 },
    { a: 'cit_c5', b: 'suc_Rcarb_carbO', order: 2 },
    ...Loh.bonds, ...Roh.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// L-Malate (step 7) — HOOC-CH(OH)-CH2-COOH  (OH on cit_c3)
// ------------------------------------------------------------------
function malate() {
  const Loh = hydroxyl('cit_c2', B4[0], [-1.00, -0.55, 0], 'suc_Lcarb_oh',
    'carboxyl', 'Left carboxylic acid hydroxyl');
  const Roh = hydroxyl('cit_c5', B4[3], [ 1.00,  0.55, 0], 'suc_Rcarb_oh',
    'carboxyl', 'Right carboxylic acid hydroxyl');
  const Mid = hydroxyl('cit_c3', B4[1], [ 0.00, -1.20, 0], 'mal_c3_oh',
    'hydroxyl', 'Secondary hydroxyl — added stereospecifically by fumarase');

  const atoms = [
    { key: 'cit_c2', el: 'C', pos: B4[0] },
    { key: 'cit_c3', el: 'C', pos: B4[1] },
    { key: 'cit_c4', el: 'C', pos: B4[2] },
    { key: 'cit_c5', el: 'C', pos: B4[3] },
    { key: 'suc_Lcarb_carbO', el: 'O', pos: add(B4[0], [-0.20, 1.00, 0]),
      group: 'carboxyl', role: 'Left carboxylate carbonyl' },
    { key: 'suc_Rcarb_carbO', el: 'O', pos: add(B4[3], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'Right carboxylate carbonyl' },
    ...Loh.atoms, ...Roh.atoms, ...Mid.atoms,
  ];
  const bonds = [
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c2', b: 'suc_Lcarb_carbO', order: 2 },
    { a: 'cit_c5', b: 'suc_Rcarb_carbO', order: 2 },
    ...Loh.bonds, ...Roh.bonds, ...Mid.bonds,
  ];
  return { atoms, bonds };
}

// ------------------------------------------------------------------
// Step 8: regenerated oxaloacetate. Same atoms as step 0.
// ------------------------------------------------------------------
function oxaloacetateRegen() {
  const Loh = hydroxyl('cit_c2', B4[0], [-1.00, -0.55, 0], 'suc_Lcarb_oh',
    'carboxyl', 'Left carboxylic acid hydroxyl');
  const Roh = hydroxyl('cit_c5', B4[3], [ 1.00,  0.55, 0], 'suc_Rcarb_oh',
    'carboxyl', 'Right carboxylic acid hydroxyl');

  const atoms = [
    { key: 'cit_c2', el: 'C', pos: B4[0] },
    { key: 'cit_c3', el: 'C', pos: B4[1] },
    { key: 'cit_c4', el: 'C', pos: B4[2] },
    { key: 'cit_c5', el: 'C', pos: B4[3] },
    { key: 'suc_Lcarb_carbO', el: 'O', pos: add(B4[0], [-0.20, 1.00, 0]),
      group: 'carboxyl', role: 'Left carboxylate carbonyl' },
    { key: 'suc_Rcarb_carbO', el: 'O', pos: add(B4[3], [0.20, -1.05, 0]),
      group: 'carboxyl', role: 'Right carboxylate carbonyl' },
    { key: 'oaa_c3_ketO', el: 'O', pos: add(B4[1], [0.00, -1.20, 0]),
      group: 'ketone', role: 'α-keto carbonyl regenerated from malate oxidation' },
    ...Loh.atoms, ...Roh.atoms,
  ];
  const bonds = [
    { a: 'cit_c2', b: 'cit_c3', order: 1 },
    { a: 'cit_c3', b: 'cit_c4', order: 1 },
    { a: 'cit_c4', b: 'cit_c5', order: 1 },
    { a: 'cit_c2', b: 'suc_Lcarb_carbO', order: 2 },
    { a: 'cit_c5', b: 'suc_Rcarb_carbO', order: 2 },
    { a: 'cit_c3', b: 'oaa_c3_ketO', order: 2 },
    ...Loh.bonds, ...Roh.bonds,
  ];
  return { atoms, bonds };
}

export const molecules = [
  oxaloacetate(),
  citrate(),
  isocitrate(),
  alphaKG(),
  succinylCoA(),
  succinate(),
  fumarate(),
  malate(),
  oxaloacetateRegen(),
];
