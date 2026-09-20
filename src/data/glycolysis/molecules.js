// Glycolysis — 11 molecular states (steps 0..10), glucose → 2× pyruvate.
//
// Conventions match the Krebs data: line-angle carbon backbone, explicit
// heteroatoms, explicit hydroxyl/aldehyde hydrogens, carboxylic acids drawn
// protonated (COOH), phosphates drawn as –O–PO₃²⁻.
//
// Hexoses (steps 0–3) are drawn OPEN-CHAIN as a 6-carbon zigzag. After
// aldolase (step 4) the chain is cleaved into two trioses that we draw as two
// stacked rows and follow IN PARALLEL through steps 5–10, so the ×2 yield of
// the "payoff phase" is visible.
//
// Atom-key bookkeeping (this is what makes transitions smooth):
//   c1..c6         the six glucose carbons — persist for the whole pathway
//   cN_O / cN_oh   the oxygen on carbon N — persists whether it is =O, –OH,
//                  or the bridging O of a phosphate (bond order morphs)
//   cN_..._H       hydroxyl / aldehyde hydrogens — enter and exit
//   pA, pB, pC, pD phosphate groups by identity (P + 3 O's):
//                    pA  added to C6 at step 1, later slides C6→C5, leaves at step 10
//                    pB  added to C1 at step 3, later slides C1→C2, leaves at step 10
//                    pC / pD  the acyl phosphates of 1,3-BPG (step 6), leave at step 7

import { add, hydroxyl, phosphate, centerMolecule } from '../molHelpers.js';

// ------------------------------------------------------------------
// Geometry
// ------------------------------------------------------------------
// Hexose zigzag, 1.3 apart. Odd carbons sit high (+0.3) → substituent UP;
// even carbons sit low (−0.3) → substituent DOWN.
const HX = [
  [-3.25,  0.3, 0], // c1
  [-1.95, -0.3, 0], // c2
  [-0.65,  0.3, 0], // c3
  [ 0.65, -0.3, 0], // c4
  [ 1.95,  0.3, 0], // c5
  [ 3.25, -0.3, 0], // c6
];
const UP   = [0,  1.0, 0];
const DOWN = [0, -1.0, 0];
const HX_EXT_L = [-1.2, -0.6, 0]; // continue zigzag leftward from c1
const HX_EXT_R = [ 1.2,  0.6, 0]; // continue zigzag rightward from c6
const HX_ALD_H = [-0.95, -0.45, 0]; // aldehyde H on c1

// Triose rows. `sign` = +1 for the top row, −1 for the bottom row. Outer
// carbons sit toward the centre line, the middle carbon sits away from it, so
// the bulky middle-carbon substituents (the phosphate in 2-PG / PEP) always
// point OUTWARD and the two rows never collide.
function rowGeom(sign) {
  const y = sign * 2.3;
  return {
    L: [-1.3, y - sign * 0.3, 0],
    M: [ 0.0, y + sign * 0.3, 0],
    R: [ 1.3, y - sign * 0.3, 0],
    outer: [0, -sign * 1.0, 0],     // substituent on an outer carbon (toward centre)
    mid:   [0,  sign * 1.0, 0],     // substituent on the middle carbon (away)
    extL:  [-1.2,  sign * 0.6, 0],  // zigzag continuation off the left carbon
    pL:    [-1.2, -sign * 0.6, 0],  // O→P direction on the left
    extR:  [ 1.2,  sign * 0.6, 0],
    pR:    [ 1.2, -sign * 0.6, 0],
    aldH:  [-0.95, sign * 0.45, 0], // aldehyde H on the left carbon (points away-left)
    midP:  [0.9, sign * 0.75, 0],   // O→P direction for a phosphate on the middle carbon (angled out-and-sideways to stay in frame)
  };
}
const T = rowGeom(+1);  // top row:    c3 (L)  c2 (M)  c1 (R)
const B = rowGeom(-1);  // bottom row: c4 (L)  c5 (M)  c6 (R)

const C = (key, pos) => ({ key, el: 'C', pos });
const O = (key, pos, extra = {}) => ({ key, el: 'O', pos, ...extra });
const H = (key, pos) => ({ key, el: 'H', pos });
const bond = (a, b, order = 1) => ({ a, b, order });

const merge = (...frags) => ({
  atoms: frags.flatMap((f) => f.atoms),
  bonds: frags.flatMap((f) => f.bonds),
});

// ------------------------------------------------------------------
// Hexose scaffolding shared by steps 0–3
// ------------------------------------------------------------------
function hexoseBackbone() {
  return {
    atoms: HX.map((p, i) => C(`c${i + 1}`, p)),
    bonds: [1, 2, 3, 4, 5].map((i) => bond(`c${i}`, `c${i + 1}`)),
  };
}
// Secondary hydroxyls on c3, c4, c5 — unchanged through the hexose steps.
function hexoseMidHydroxyls() {
  return merge(
    hydroxyl('c3', HX[2], UP,   'c3_oh', 'hydroxyl', 'C3 secondary hydroxyl'),
    hydroxyl('c4', HX[3], DOWN, 'c4_oh', 'hydroxyl', 'C4 secondary hydroxyl'),
    hydroxyl('c5', HX[4], UP,   'c5_oh', 'hydroxyl', 'C5 secondary hydroxyl'),
  );
}
// C6 as –CH₂–O–PO₃²⁻ (the bridging O keeps the key of the former hydroxyl).
function hexoseC6Phosphate() {
  const o = add(HX[5], HX_EXT_R);
  return merge(
    { atoms: [O('c6_oh', o, { group: 'phosphate', role: 'Bridging oxygen of the C6 phosphate ester' })],
      bonds: [bond('c6', 'c6_oh')] },
    phosphate('c6_oh', o, [1.2, -0.6, 0], 'pA', 'phosphate',
      'C6 phosphate — traps the sugar inside the cell and primes it for cleavage'),
  );
}

// ------------------------------------------------------------------
// Step 0 — Glucose (open chain)  OHC–(CHOH)₄–CH₂OH
// ------------------------------------------------------------------
function glucose() {
  const ald = {
    atoms: [
      O('c1_O', add(HX[0], [-0.2, 1.0, 0]), { group: 'aldehyde', role: 'C1 aldehyde carbonyl' }),
      H('c1_H', add(HX[0], HX_ALD_H)),
    ],
    bonds: [bond('c1', 'c1_O', 2), bond('c1', 'c1_H')],
  };
  return centerMolecule(merge(
    hexoseBackbone(),
    ald,
    hydroxyl('c2', HX[1], DOWN, 'c2_oh', 'hydroxyl', 'C2 secondary hydroxyl'),
    hexoseMidHydroxyls(),
    hydroxyl('c6', HX[5], HX_EXT_R, 'c6_oh', 'hydroxyl',
      'C6 primary hydroxyl — the site hexokinase phosphorylates in step 1'),
  ));
}

// ------------------------------------------------------------------
// Step 1 — Glucose-6-phosphate
// ------------------------------------------------------------------
function g6p() {
  const ald = {
    atoms: [
      O('c1_O', add(HX[0], [-0.2, 1.0, 0]), { group: 'aldehyde', role: 'C1 aldehyde carbonyl' }),
      H('c1_H', add(HX[0], HX_ALD_H)),
    ],
    bonds: [bond('c1', 'c1_O', 2), bond('c1', 'c1_H')],
  };
  return centerMolecule(merge(
    hexoseBackbone(),
    ald,
    hydroxyl('c2', HX[1], DOWN, 'c2_oh', 'hydroxyl', 'C2 secondary hydroxyl'),
    hexoseMidHydroxyls(),
    hexoseC6Phosphate(),
  ));
}

// ------------------------------------------------------------------
// Step 2 — Fructose-6-phosphate (open chain)  HOCH₂–C(=O)–(CHOH)₃–CH₂OPO₃²⁻
// The aldehyde O on c1 becomes a primary hydroxyl (bond 2→1, gains H);
// the c2 hydroxyl becomes a ketone (bond 1→2, loses H).
// ------------------------------------------------------------------
function f6p() {
  const c1oh = hydroxyl('c1', HX[0], HX_EXT_L, 'c1_O', 'hydroxyl',
    'C1 primary hydroxyl — formed from the aldehyde by isomerisation');
  const ket = {
    atoms: [O('c2_oh', add(HX[1], DOWN), { group: 'ketone', role: 'C2 ketone — fructose is a ketose' })],
    bonds: [bond('c2', 'c2_oh', 2)],
  };
  return centerMolecule(merge(
    hexoseBackbone(),
    c1oh,
    ket,
    hexoseMidHydroxyls(),
    hexoseC6Phosphate(),
  ));
}

// ------------------------------------------------------------------
// Step 3 — Fructose-1,6-bisphosphate
// ------------------------------------------------------------------
function f16bp() {
  const o1 = add(HX[0], HX_EXT_L);
  const c1p = merge(
    { atoms: [O('c1_O', o1, { group: 'phosphate', role: 'Bridging oxygen of the C1 phosphate ester' })],
      bonds: [bond('c1', 'c1_O')] },
    phosphate('c1_O', o1, [-1.2, 0.6, 0], 'pB', 'phosphate',
      'C1 phosphate — added by PFK-1, the committed step of glycolysis'),
  );
  const ket = {
    atoms: [O('c2_oh', add(HX[1], DOWN), { group: 'ketone', role: 'C2 ketone' })],
    bonds: [bond('c2', 'c2_oh', 2)],
  };
  return centerMolecule(merge(
    hexoseBackbone(),
    c1p,
    ket,
    hexoseMidHydroxyls(),
    hexoseC6Phosphate(),
  ));
}

// ------------------------------------------------------------------
// Triose scaffolding for steps 4–10
// ------------------------------------------------------------------
// Row carbons. Top row reads c3–c2–c1 (so its phosphate, on c1, sits on the
// right just like the bottom row's phosphate on c6).
function topBackbone()    { return { atoms: [C('c3', T.L), C('c2', T.M), C('c1', T.R)], bonds: [bond('c3', 'c2'), bond('c2', 'c1')] }; }
function bottomBackbone() { return { atoms: [C('c4', B.L), C('c5', B.M), C('c6', B.R)], bonds: [bond('c4', 'c5'), bond('c5', 'c6')] }; }

// Right-hand –CH₂–O–PO₃²⁻ for a row (bridging O key = the carbon's own O key).
function rowRightPhosphate(g, cKey, oKey, pid, role) {
  const o = add(g.R, g.extR);
  return merge(
    { atoms: [O(oKey, o, { group: 'phosphate', role: 'Bridging oxygen of the phosphate ester' })],
      bonds: [bond(cKey, oKey)] },
    phosphate(oKey, o, g.pR, pid, 'phosphate', role),
  );
}
// Right-hand –CH₂–OH for a row.
function rowRightHydroxyl(g, cKey, oKey, role) {
  return hydroxyl(cKey, g.R, g.extR, oKey, 'hydroxyl', role);
}
// Left-hand aldehyde –CHO.
function rowLeftAldehyde(g, cKey, oKey, hKey, role) {
  return {
    atoms: [O(oKey, add(g.L, g.outer), { group: 'aldehyde', role }), H(hKey, add(g.L, g.aldH))],
    bonds: [bond(cKey, oKey, 2), bond(cKey, hKey)],
  };
}
// Left-hand acyl phosphate –C(=O)–O–PO₃²⁻.
function rowLeftAcylPhosphate(g, cKey, oKey, bridgeKey, pid, role) {
  const o = add(g.L, g.extL);
  return merge(
    { atoms: [
        O(oKey, add(g.L, g.outer), { group: 'acylphosphate', role: 'Acyl-phosphate carbonyl' }),
        O(bridgeKey, o, { group: 'acylphosphate', role: 'Bridging oxygen of the acyl phosphate' }),
      ],
      bonds: [bond(cKey, oKey, 2), bond(cKey, bridgeKey)] },
    phosphate(bridgeKey, o, g.pL, pid, 'acylphosphate', role),
  );
}
// Left-hand carboxylic acid –C(=O)–OH  (the –OH oxygen is the former bridging O).
function rowLeftCarboxyl(g, cKey, oKey, ohKey, role) {
  return merge(
    { atoms: [O(oKey, add(g.L, g.outer), { group: 'carboxyl', role: 'Carboxyl carbonyl' })],
      bonds: [bond(cKey, oKey, 2)] },
    hydroxyl(cKey, g.L, g.extL, ohKey, 'carboxyl', role),
  );
}
// Middle-carbon hydroxyl / ketone / phosphate.
function rowMidHydroxyl(g, cKey, oKey, role) { return hydroxyl(cKey, g.M, g.mid, oKey, 'hydroxyl', role); }
function rowMidKetone(g, cKey, oKey, role) {
  return { atoms: [O(oKey, add(g.M, g.mid), { group: 'ketone', role })], bonds: [bond(cKey, oKey, 2)] };
}
function rowMidPhosphate(g, cKey, oKey, pid, role) {
  const o = add(g.M, g.mid);
  return merge(
    { atoms: [O(oKey, o, { group: 'phosphate', role: 'Bridging oxygen of the C2 phosphate ester' })],
      bonds: [bond(cKey, oKey)] },
    phosphate(oKey, o, g.midP, pid, 'phosphate', role),
  );
}

// ------------------------------------------------------------------
// Step 4 — Aldolase cleavage:  DHAP (top)  +  G3P (bottom)
//   DHAP  = HOCH₂(c3)–C(=O)(c2)–CH₂OPO₃²⁻(c1)
//   G3P   = OHC(c4)–CHOH(c5)–CH₂OPO₃²⁻(c6)
// ------------------------------------------------------------------
function dhapPlusG3p() {
  return centerMolecule(merge(
    topBackbone(),
    hydroxyl('c3', T.L, T.outer, 'c3_oh', 'hydroxyl', 'C3 primary hydroxyl of DHAP'),
    rowMidKetone(T, 'c2', 'c2_oh', 'C2 ketone of dihydroxyacetone phosphate'),
    rowRightPhosphate(T, 'c1', 'c1_O', 'pB', 'C1 phosphate of DHAP'),
    bottomBackbone(),
    rowLeftAldehyde(B, 'c4', 'c4_oh', 'c4_H', 'C1 aldehyde of glyceraldehyde-3-phosphate (formed at the cleavage site)'),
    rowMidHydroxyl(B, 'c5', 'c5_oh', 'C2 secondary hydroxyl of G3P'),
    rowRightPhosphate(B, 'c6', 'c6_oh', 'pA', 'C3 phosphate of G3P'),
  ));
}

// ------------------------------------------------------------------
// Step 5 — Triose phosphate isomerase: both rows are now G3P
// ------------------------------------------------------------------
function twoG3p() {
  return centerMolecule(merge(
    topBackbone(),
    rowLeftAldehyde(T, 'c3', 'c3_oh', 'c3_H', 'C1 aldehyde — formed from the DHAP hydroxymethyl by TPI'),
    rowMidHydroxyl(T, 'c2', 'c2_oh', 'C2 hydroxyl — formed from the DHAP ketone by TPI'),
    rowRightPhosphate(T, 'c1', 'c1_O', 'pB', 'C3 phosphate'),
    bottomBackbone(),
    rowLeftAldehyde(B, 'c4', 'c4_oh', 'c4_H', 'C1 aldehyde of G3P'),
    rowMidHydroxyl(B, 'c5', 'c5_oh', 'C2 secondary hydroxyl of G3P'),
    rowRightPhosphate(B, 'c6', 'c6_oh', 'pA', 'C3 phosphate of G3P'),
  ));
}

// ------------------------------------------------------------------
// Step 6 — 2× 1,3-Bisphosphoglycerate (acyl phosphate on C1)
// ------------------------------------------------------------------
function twoBpg() {
  return centerMolecule(merge(
    topBackbone(),
    rowLeftAcylPhosphate(T, 'c3', 'c3_oh', 'c3_pO', 'pC', 'High-energy acyl phosphate — will pay for the first ATP'),
    rowMidHydroxyl(T, 'c2', 'c2_oh', 'C2 secondary hydroxyl'),
    rowRightPhosphate(T, 'c1', 'c1_O', 'pB', 'C3 phosphate'),
    bottomBackbone(),
    rowLeftAcylPhosphate(B, 'c4', 'c4_oh', 'c4_pO', 'pD', 'High-energy acyl phosphate — will pay for the first ATP'),
    rowMidHydroxyl(B, 'c5', 'c5_oh', 'C2 secondary hydroxyl'),
    rowRightPhosphate(B, 'c6', 'c6_oh', 'pA', 'C3 phosphate'),
  ));
}

// ------------------------------------------------------------------
// Step 7 — 2× 3-Phosphoglycerate (carboxylic acid on C1)
// ------------------------------------------------------------------
function twoPg3() {
  return centerMolecule(merge(
    topBackbone(),
    rowLeftCarboxyl(T, 'c3', 'c3_oh', 'c3_pO', 'C1 carboxyl — left behind after phosphoryl transfer to ADP'),
    rowMidHydroxyl(T, 'c2', 'c2_oh', 'C2 secondary hydroxyl'),
    rowRightPhosphate(T, 'c1', 'c1_O', 'pB', 'C3 phosphate'),
    bottomBackbone(),
    rowLeftCarboxyl(B, 'c4', 'c4_oh', 'c4_pO', 'C1 carboxyl — left behind after phosphoryl transfer to ADP'),
    rowMidHydroxyl(B, 'c5', 'c5_oh', 'C2 secondary hydroxyl'),
    rowRightPhosphate(B, 'c6', 'c6_oh', 'pA', 'C3 phosphate'),
  ));
}

// ------------------------------------------------------------------
// Step 8 — 2× 2-Phosphoglycerate (phosphate slides C3 → C2)
// ------------------------------------------------------------------
function twoPg2() {
  return centerMolecule(merge(
    topBackbone(),
    rowLeftCarboxyl(T, 'c3', 'c3_oh', 'c3_pO', 'C1 carboxyl'),
    rowMidPhosphate(T, 'c2', 'c2_oh', 'pB', 'C2 phosphate — relocated by phosphoglycerate mutase'),
    rowRightHydroxyl(T, 'c1', 'c1_O', 'C3 primary hydroxyl — freed when the phosphate moved to C2'),
    bottomBackbone(),
    rowLeftCarboxyl(B, 'c4', 'c4_oh', 'c4_pO', 'C1 carboxyl'),
    rowMidPhosphate(B, 'c5', 'c5_oh', 'pA', 'C2 phosphate — relocated by phosphoglycerate mutase'),
    rowRightHydroxyl(B, 'c6', 'c6_oh', 'C3 primary hydroxyl — freed when the phosphate moved to C2'),
  ));
}

// ------------------------------------------------------------------
// Step 9 — 2× Phosphoenolpyruvate  H₂C=C(OPO₃²⁻)–COOH
// Dehydration: the C3 hydroxyl leaves as water; C2=C3 double bond forms.
// ------------------------------------------------------------------
function twoPep() {
  const top = merge(
    topBackbone(),
    rowLeftCarboxyl(T, 'c3', 'c3_oh', 'c3_pO', 'C1 carboxyl'),
    rowMidPhosphate(T, 'c2', 'c2_oh', 'pB', 'Enol phosphate — a very high-energy phosphoryl group'),
  );
  const bottom = merge(
    bottomBackbone(),
    rowLeftCarboxyl(B, 'c4', 'c4_oh', 'c4_pO', 'C1 carboxyl'),
    rowMidPhosphate(B, 'c5', 'c5_oh', 'pA', 'Enol phosphate — a very high-energy phosphoryl group'),
  );
  // Promote the c2–c1 and c5–c6 bonds to double (C=CH₂).
  const promote = (mol, a, b) => ({
    atoms: mol.atoms,
    bonds: mol.bonds.map((bd) =>
      (bd.a === a && bd.b === b) || (bd.a === b && bd.b === a) ? { ...bd, order: 2 } : bd),
  });
  return centerMolecule(merge(promote(top, 'c2', 'c1'), promote(bottom, 'c5', 'c6')));
}

// ------------------------------------------------------------------
// Step 10 — 2× Pyruvate  H₃C–C(=O)–COOH
// Phosphoryl transfer to ADP, then enol → keto tautomerisation.
// ------------------------------------------------------------------
function twoPyruvate() {
  return centerMolecule(merge(
    topBackbone(),
    rowLeftCarboxyl(T, 'c3', 'c3_oh', 'c3_pO', 'C1 carboxyl of pyruvate'),
    rowMidKetone(T, 'c2', 'c2_oh', 'C2 ketone — formed by tautomerisation of the enol'),
    bottomBackbone(),
    rowLeftCarboxyl(B, 'c4', 'c4_oh', 'c4_pO', 'C1 carboxyl of pyruvate'),
    rowMidKetone(B, 'c5', 'c5_oh', 'C2 ketone — formed by tautomerisation of the enol'),
  ));
}

export const molecules = [
  glucose(),
  g6p(),
  f6p(),
  f16bp(),
  dhapPlusG3p(),
  twoG3p(),
  twoBpg(),
  twoPg3(),
  twoPg2(),
  twoPep(),
  twoPyruvate(),
];
