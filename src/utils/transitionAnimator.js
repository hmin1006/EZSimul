// Given previous and next molecule data, build a set of "tween" atoms & bonds.
// Each atom in the result carries its from-state, to-state, and an opacity profile.
//
// Rule:
//   - Atoms present in both (same `key`): tween position; opacity stays 1.
//   - Atoms only in `next`: spawn in (fade in + scale up from 0).
//   - Atoms only in `prev`: fade out + drift outward slightly.

export function buildTween(prev, next) {
  const byKey = (arr) => Object.fromEntries(arr.map(a => [a.key, a]));
  const pa = byKey(prev.atoms);
  const na = byKey(next.atoms);

  const allKeys = new Set([...Object.keys(pa), ...Object.keys(na)]);
  const atoms = [];
  for (const k of allKeys) {
    const p = pa[k];
    const n = na[k];
    if (p && n) {
      atoms.push({ key: k, kind: 'persist', from: p, to: n });
    } else if (n) {
      atoms.push({ key: k, kind: 'enter', from: null, to: n });
    } else {
      atoms.push({ key: k, kind: 'exit', from: p, to: null });
    }
  }

  // Bonds: a bond persists if both atoms persist and both states have the bond.
  // Bond is keyed by sorted endpoints + order.
  const bondKey = (b) => {
    const [x, y] = [b.a, b.b].sort();
    return `${x}|${y}`;
  };

  const prevBonds = new Map(prev.bonds.map(b => [bondKey(b), b]));
  const nextBonds = new Map(next.bonds.map(b => [bondKey(b), b]));

  const allBondKeys = new Set([...prevBonds.keys(), ...nextBonds.keys()]);
  const bonds = [];
  for (const bk of allBondKeys) {
    const p = prevBonds.get(bk);
    const n = nextBonds.get(bk);
    if (p && n) {
      bonds.push({ kind: 'persist', from: p, to: n });
    } else if (n) {
      bonds.push({ kind: 'enter', from: null, to: n });
    } else {
      bonds.push({ kind: 'exit', from: p, to: null });
    }
  }

  return { atoms, bonds };
}

// Easing: cubic in-out
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Linear lerp of vec3
export const lerpVec = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
