// Shared geometry helpers for declaring molecules.
//
// Every builder returns { atoms, bonds } fragments that the molecule
// definitions spread into their own lists. Keys are chosen by the caller so
// that the SAME atom keeps the same key across steps — that is what lets the
// renderer tween shared atoms instead of fading them out and back in.

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const unit = (v) => {
  const L = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / L, v[1] / L, v[2] / L];
};

// ------------------------------------------------------------------
// Hydroxyl: parent –O–H. The O sits at parentPos + dir, the H continues a
// further 0.75 units along the same direction. H key is `${keyO}_H`.
// ------------------------------------------------------------------
const OH_EXTEND = 0.75;
export function hydroxyl(parentKey, parentPos, dir, keyO, group, role) {
  const oPos = add(parentPos, dir);
  const u = unit(dir);
  const hPos = [oPos[0] + u[0] * OH_EXTEND, oPos[1] + u[1] * OH_EXTEND, oPos[2] + u[2] * OH_EXTEND];
  return {
    atoms: [
      { key: keyO, el: 'O', pos: oPos, group, role },
      { key: `${keyO}_H`, el: 'H', pos: hPos },
    ],
    bonds: [
      { a: parentKey, b: keyO, order: 1 },
      { a: keyO, b: `${keyO}_H`, order: 1 },
    ],
  };
}

// ------------------------------------------------------------------
// Phosphate: bridging-O –P(=O)(O⁻)(O⁻). The caller supplies the bridging
// oxygen (key + position) because that oxygen is usually an atom that already
// existed (e.g. a hydroxyl O that gets phosphorylated). P sits at
// bridgePos + dir; its three oxygens fan out around it. Keys are
// `${id}_P`, `${id}_O1` (=O), `${id}_O2`, `${id}_O3` (both O⁻).
// ------------------------------------------------------------------
const PO_LEN = 1.05;
export function phosphate(bridgeKey, bridgePos, dir, id, group, role) {
  const P = add(bridgePos, dir);
  const d = unit(dir);
  const n = [-d[1], d[0], 0]; // in-plane perpendicular
  const O1 = [P[0] + n[0] * PO_LEN, P[1] + n[1] * PO_LEN, P[2]];
  const O2 = [P[0] + d[0] * PO_LEN, P[1] + d[1] * PO_LEN, P[2]];
  const O3 = [P[0] - n[0] * PO_LEN, P[1] - n[1] * PO_LEN, P[2]];
  return {
    atoms: [
      { key: `${id}_P`,  el: 'P', pos: P,  group, role },
      { key: `${id}_O1`, el: 'O', pos: O1, group, role },
      { key: `${id}_O2`, el: 'O', pos: O2, group, role, charge: -1 },
      { key: `${id}_O3`, el: 'O', pos: O3, group, role, charge: -1 },
    ],
    bonds: [
      { a: bridgeKey,  b: `${id}_P`,  order: 1 },
      { a: `${id}_P`,  b: `${id}_O1`, order: 2 },
      { a: `${id}_P`,  b: `${id}_O2`, order: 1 },
      { a: `${id}_P`,  b: `${id}_O3`, order: 1 },
    ],
  };
}

// ------------------------------------------------------------------
// Recentre a molecule so its bounding box is centred on the origin. Keeps
// wide molecules (hexose + two phosphates) framed by a fixed camera.
// ------------------------------------------------------------------
export function centerMolecule(mol) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const a of mol.atoms) {
    minX = Math.min(minX, a.pos[0]); maxX = Math.max(maxX, a.pos[0]);
    minY = Math.min(minY, a.pos[1]); maxY = Math.max(maxY, a.pos[1]);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return {
    atoms: mol.atoms.map((a) => ({ ...a, pos: [a.pos[0] - cx, a.pos[1] - cy, a.pos[2]] })),
    bonds: mol.bonds,
  };
}
