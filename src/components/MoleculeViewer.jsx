import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { molecules } from '../data/molecules.js';
import { HIGHLIGHTS } from '../data/highlights.js';
import { buildTween, easeInOut, lerpVec } from '../utils/transitionAnimator.js';

// Modern editorial palette — matches index.css.
const COLORS = {
  C: '#161616',     // near-black, the dominant ink color
  O: '#c44539',     // signal red
  S: '#b88420',     // amber
  H: '#888888',     // soft grey
  bond: '#1f1f1f',
  bondHighlight: '#0a8866',
};

// Symbol label color overrides (so labels stay legible against the canvas).
const LABEL_COLORS = {
  O: '#c44539',
  S: '#b88420',
  H: '#5a5a5a',
};

// Atom sphere radius by element. Non-C heteroatoms are noticeably larger so
// they stand out against the carbon vertices. Hydrogens are half the size of
// oxygen, per the spec.
const ATOM_RADIUS = {
  C: 0.08,
  O: 0.28,
  S: 0.32,
  H: 0.14,
};

// Font size (px) for the inline element-symbol label next to each heteroatom.
const LABEL_FONT = {
  O: 28,
  S: 28,
  H: 22,
};

// Offset (px) for the element-symbol label relative to the atom center.
// Zero offsets put the symbol exactly in the middle of the sphere.
const LABEL_OFFSET = {
  O: [0, 0],
  S: [0, 0],
  H: [0, 0],
};

// A crisp white "halo" outline around the atom symbols — four offset shadows
// build the outline, plus a soft blur for legibility against any backdrop.
const LABEL_TEXT_SHADOW = [
  '-1.5px -1.5px 0 #ffffff',
  '1.5px -1.5px 0 #ffffff',
  '-1.5px 1.5px 0 #ffffff',
  '1.5px 1.5px 0 #ffffff',
  '0 0 8px rgba(255,255,255,0.95)',
  '0 0 4px rgba(255,255,255,1)',
].join(', ');

// ------------------------------------------------------------------
// Helpers for building bond geometry
// ------------------------------------------------------------------
function cylinderBetween(a, b) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return { position: mid.toArray(), quaternion, length };
}

// ------------------------------------------------------------------
// Functional-group highlight — a unified marker-yellow shape covering an
// entire group. We render two kinds of geometry, both sharing the same
// material, so the result reads as one continuous shape:
//
//   • HighlightSphere — a thick sphere at every highlighted atom
//   • HighlightBond   — a fat capsule along every bond whose BOTH endpoints
//                       are highlighted (this is what "connects" the atoms
//                       so the group is recognised as a single unit)
//
// All highlight geometry is rendered before atoms (renderOrder: -1) with
// depth testing off, so atoms always paint cleanly on top.
// ------------------------------------------------------------------
const HIGHLIGHT_COLOR = '#ffd84a'; // warm marker yellow
const HIGHLIGHT_BASE_OPACITY = 0.6;

// Radius of the highlight sphere around each atom — sized so spheres on
// adjacent bonded atoms overlap and merge into one continuous shape.
const HIGHLIGHT_RADIUS = {
  C: 0.34,
  O: 0.46,
  S: 0.54,
  H: 0.30,
  L: 0.62,   // generous for the "CoA" floating text label
};

// Radius of the connecting capsule along a highlighted bond. A bit thinner
// than the sphere radius keeps the silhouette clean.
const HIGHLIGHT_BOND_RADIUS = 0.26;

function HighlightSphere({ pos, el = 'C', opacity = 1 }) {
  if (opacity < 0.02) return null;
  const r = HIGHLIGHT_RADIUS[el] ?? 0.34;
  return (
    <mesh position={pos} renderOrder={-1}>
      <sphereGeometry args={[r, 18, 14]} />
      <meshBasicMaterial
        color={HIGHLIGHT_COLOR}
        transparent
        opacity={HIGHLIGHT_BASE_OPACITY * opacity}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

function HighlightBond({ from, to, opacity = 1 }) {
  const geom = useMemo(
    () => cylinderBetween(from, to),
    [from[0], from[1], from[2], to[0], to[1], to[2]]
  );
  if (opacity < 0.02) return null;
  return (
    <mesh position={geom.position} quaternion={geom.quaternion} renderOrder={-1}>
      <cylinderGeometry args={[HIGHLIGHT_BOND_RADIUS, HIGHLIGHT_BOND_RADIUS, geom.length, 16]} />
      <meshBasicMaterial
        color={HIGHLIGHT_COLOR}
        transparent
        opacity={HIGHLIGHT_BASE_OPACITY * opacity}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// ------------------------------------------------------------------
// Atom component (carbon vertex OR heteroatom sphere) + optional HTML label
// ------------------------------------------------------------------
function AtomNode({ atom, opacity = 1, scale = 1, onHoverGroup }) {
  const { el, pos } = atom;
  if (el === 'L') {
    // pure label — used for group labels like "CoA"
    return (
      <Html position={pos} center distanceFactor={8} zIndexRange={[10, 0]}>
        <div
          style={{
            color: atom.color || '#b88420',
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
            fontVariationSettings: "'wdth' 88, 'opsz' 48",
            letterSpacing: '-0.015em',
            opacity,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: 'none',
            userSelect: 'none',
            pointerEvents: 'auto',
            cursor: atom.group ? 'help' : 'default',
            textShadow: LABEL_TEXT_SHADOW,
            whiteSpace: 'nowrap',
          }}
          onPointerEnter={(e) =>
            atom.group && onHoverGroup?.({ x: e.clientX, y: e.clientY, atom })
          }
          onPointerMove={(e) =>
            atom.group && onHoverGroup?.({ x: e.clientX, y: e.clientY, atom })
          }
          onPointerLeave={() => atom.group && onHoverGroup?.(null)}
        >
          {atom.label}
        </div>
      </Html>
    );
  }

  const isCarbon = el === 'C';
  const color = COLORS[el] || '#15252e';
  const labelColor = LABEL_COLORS[el] || color;
  const radius = ATOM_RADIUS[el] ?? 0.2;
  const fontSize = LABEL_FONT[el] ?? 16;
  const [dx, dy] = LABEL_OFFSET[el] ?? [14, -8];

  return (
    <group position={pos} scale={scale}>
      <mesh
        onPointerEnter={(e) => {
          if (atom.group) {
            e.stopPropagation();
            onHoverGroup?.({ x: e.clientX, y: e.clientY, atom });
          }
        }}
        onPointerMove={(e) => {
          if (atom.group) {
            onHoverGroup?.({ x: e.clientX, y: e.clientY, atom });
          }
        }}
        onPointerLeave={() => atom.group && onHoverGroup?.(null)}
      >
        <sphereGeometry args={[radius, 22, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.95}
          metalness={0.0}
          emissive={color}
          emissiveIntensity={0}
        />
      </mesh>
      {!isCarbon && (
        <Html
          position={[0, 0, 0]}
          center
          distanceFactor={9}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: labelColor,
              fontSize,
              fontWeight: 700,
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontVariationSettings: "'wdth' 86, 'opsz' 48",
              letterSpacing: '-0.02em',
              opacity: opacity * 1.0,
              textShadow: LABEL_TEXT_SHADOW,
              transform: `translate(${dx}px, ${dy}px)`,
              userSelect: 'none',
            }}
          >
            {el}
          </div>
        </Html>
      )}
    </group>
  );
}

// ------------------------------------------------------------------
// Bond (single or double) — rendered as 1 or 2 thin cylinders
// ------------------------------------------------------------------
function BondMesh({ from, to, order = 1, opacity = 1 }) {
  const geom = useMemo(() => cylinderBetween(from, to), [from[0], from[1], from[2], to[0], to[1], to[2]]);
  // Bonds are drawn slightly heavier on cream paper so the ink reads as confident strokes.
  const radius = 0.045;

  if (order === 2) {
    // two parallel cylinders offset perpendicular to bond and roughly in-plane
    const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
    // Use Z as the "out-of-plane" normal; pick perpendicular in the XY plane
    let perp = new THREE.Vector3(0, 0, 1).cross(dir);
    if (perp.lengthSq() < 0.01) perp = new THREE.Vector3(1, 0, 0).cross(dir);
    perp.normalize().multiplyScalar(0.08);

    return (
      <>
        <mesh
          position={new THREE.Vector3(...geom.position).add(perp).toArray()}
          quaternion={geom.quaternion}
        >
          <cylinderGeometry args={[radius * 0.8, radius * 0.8, geom.length, 10]} />
          <meshStandardMaterial color={COLORS.bond} transparent opacity={opacity} roughness={0.95} metalness={0} />
        </mesh>
        <mesh
          position={new THREE.Vector3(...geom.position).sub(perp).toArray()}
          quaternion={geom.quaternion}
        >
          <cylinderGeometry args={[radius * 0.8, radius * 0.8, geom.length, 10]} />
          <meshStandardMaterial color={COLORS.bond} transparent opacity={opacity} roughness={0.95} metalness={0} />
        </mesh>
      </>
    );
  }

  return (
    <mesh position={geom.position} quaternion={geom.quaternion}>
      <cylinderGeometry args={[radius, radius, geom.length, 10]} />
      <meshStandardMaterial color={COLORS.bond} transparent opacity={opacity} roughness={0.6} />
    </mesh>
  );
}

// ------------------------------------------------------------------
// Transitioning molecule — three-phase, step-by-step animation:
//
//   [0 ............ PHASE_EXIT_END]   the leaving group fades out and drifts away
//   [PHASE_MOVE_START .. PHASE_MOVE_END]  persisting atoms tween to new positions;
//                                         bond-order changes happen here
//   [PHASE_ENTER_START ............ 1]    the incoming group drifts in and fades up
//
// Each phase uses an internal cubic ease so motion feels smooth, but the three
// phases don't overlap — you clearly see "leave → rearrange → arrive".
// ------------------------------------------------------------------
const TRANSITION_DURATION_MS = 3000;
const PHASE_EXIT_END    = 0.33;
const PHASE_MOVE_START  = 0.36;
const PHASE_MOVE_END    = 0.64;
const PHASE_ENTER_START = 0.67;

function phaseProgress(t, start, end) {
  if (t <= start) return 0;
  if (t >= end) return 1;
  const p = (t - start) / (end - start);
  return easeInOut(p);
}

function TransitioningMolecule({ prevIndex, nextIndex, onHoverGroup, onDone }) {
  const [progress, setProgress] = useState(prevIndex === nextIndex ? 1 : 0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (prevIndex === nextIndex) {
      setProgress(1);
      return;
    }
    startTimeRef.current = performance.now();
    setProgress(0);
  }, [prevIndex, nextIndex]);

  useFrame(() => {
    if (prevIndex === nextIndex) return;
    if (startTimeRef.current == null) return;
    const elapsed = performance.now() - startTimeRef.current;
    const t = Math.min(1, elapsed / TRANSITION_DURATION_MS);
    setProgress(t);
    if (t >= 1 && onDone) {
      onDone();
      startTimeRef.current = null;
    }
  });

  const prev = molecules[prevIndex];
  const next = molecules[nextIndex];
  const tween = useMemo(() => buildTween(prev, next), [prevIndex, nextIndex]);

  const tRaw = progress;
  const exitT  = phaseProgress(tRaw, 0,                 PHASE_EXIT_END);
  const moveT  = phaseProgress(tRaw, PHASE_MOVE_START,  PHASE_MOVE_END);
  const enterT = phaseProgress(tRaw, PHASE_ENTER_START, 1);

  const byKey = useMemo(() => {
    const m = {};
    for (const a of tween.atoms) m[a.key] = a;
    return m;
  }, [tween]);

  // Drift offsets for exit/enter atoms — extra distance and a bit of y/z
  // displacement so the motion reads clearly as "leaving" or "arriving."
  const exitDrift = (start) => [
    start[0] + Math.sign(start[0] || 1) * 1.8,
    start[1] - 1.6,
    start[2] - 0.5,
  ];
  const enterDrift = (final) => [
    final[0] + Math.sign(final[0] || 1) * 1.8,
    final[1] + 1.8,
    final[2] + 0.6,
  ];

  // Within enter/exit phases we sub-divide time so atoms move FIRST and bonds
  // form/break afterwards. This avoids the awkward "very long bond that
  // contracts" effect — the entering atom approaches its final position over
  // the first 70% of the enter phase, and only then the connecting bond
  // appears in the last 30%. Mirrored for exit: the bond breaks during the
  // first 30% of the exit phase, then the atom drifts away.
  const ENTER_POS_END = 0.70;   // entering atom reaches final by this fraction of enterT
  const ENTER_BOND_START = 0.70; // entering bond starts to appear here
  const EXIT_BOND_END = 0.30;   // exiting bond fully gone by this fraction of exitT
  const EXIT_POS_START = 0.30;  // exiting atom starts drifting from here

  const enterPosT = Math.min(1, enterT / ENTER_POS_END);
  const exitPosT  = Math.max(0, (exitT - EXIT_POS_START) / (1 - EXIT_POS_START));
  const enterBondT = Math.max(0, (enterT - ENTER_BOND_START) / (1 - ENTER_BOND_START));
  const exitBondT  = Math.min(1, exitT / EXIT_BOND_END);

  // Position lookup for bond endpoints — respects phase logic for every kind.
  const posForKey = (key) => {
    const a = byKey[key];
    if (!a) return [0, 0, 0];
    if (a.kind === 'persist') return lerpVec(a.from.pos, a.to.pos, moveT);
    if (a.kind === 'enter')   return lerpVec(enterDrift(a.to.pos), a.to.pos, enterPosT);
    return lerpVec(a.from.pos, exitDrift(a.from.pos), exitPosT);
  };

  // ---- Functional-group highlight ----
  // We render a unified yellow shape: a sphere at every highlighted atom
  // PLUS a fat capsule along every bond whose two endpoints are both
  // highlighted. The connecting capsules are what glue the per-atom spheres
  // together so the highlight reads as ONE shape spanning the group, rather
  // than as separate atom halos.
  //
  // During a transition we fade the previous step's highlight out and the
  // next step's highlight in, both gated by the underlying atom's enter/exit
  // visibility so the highlight stays anchored to the molecule.
  const prevSet = useMemo(() => new Set(HIGHLIGHTS[prevIndex] || []), [prevIndex]);
  const nextSet = useMemo(() => new Set(HIGHLIGHTS[nextIndex] || []), [nextIndex]);
  const allHighlightKeys = useMemo(
    () => new Set([...prevSet, ...nextSet]),
    [prevSet, nextSet]
  );

  // Highlighted bonds: any bond from prev or next whose two endpoints are
  // both in the corresponding step's highlight set.
  const highlightBonds = useMemo(() => {
    const map = new Map();
    const bondKey = (b) => [b.a, b.b].sort().join('|');
    for (const b of prev.bonds) {
      if (prevSet.has(b.a) && prevSet.has(b.b)) {
        map.set(bondKey(b), { a: b.a, b: b.b, inPrev: true, inNext: false });
      }
    }
    for (const b of next.bonds) {
      if (nextSet.has(b.a) && nextSet.has(b.b)) {
        const k = bondKey(b);
        if (map.has(k)) map.get(k).inNext = true;
        else map.set(k, { a: b.a, b: b.b, inPrev: false, inNext: true });
      }
    }
    return [...map.values()];
  }, [prev, next, prevSet, nextSet]);

  // Existence opacity for an atom (whether the atom itself is currently
  // visible at all, given its enter/persist/exit kind). We use the *position*
  // sub-progress so the highlight halo travels in step with the atom — the
  // halo reaches full strength when the atom reaches its final spot, and
  // stays anchored to it as the bond forms.
  const atomExistOpacity = (a) => {
    if (!a) return 0;
    if (a.kind === 'persist') return 1;
    if (a.kind === 'enter')   return enterPosT;
    return 1 - exitPosT;
  };

  // Highlight-set opacity for a key — handles fading the highlight on or off
  // when a step changes the highlighted group.
  const highlightSetOpacity = (key) => {
    const inPrev = prevSet.has(key);
    const inNext = nextSet.has(key);
    if (inPrev && inNext) return 1;
    if (inNext) return enterT;
    if (inPrev) return 1 - exitT;
    return 0;
  };

  const highlightOpacityFor = (key) => {
    const a = byKey[key];
    if (!a) return 0;
    return atomExistOpacity(a) * highlightSetOpacity(key);
  };

  const highlightBondOpacityFor = (b) => {
    let setOp;
    if (b.inPrev && b.inNext) setOp = 1;
    else if (b.inNext)        setOp = enterT;
    else                       setOp = 1 - exitT;

    const aA = byKey[b.a];
    const aB = byKey[b.b];
    const existOp = Math.min(atomExistOpacity(aA), atomExistOpacity(aB));
    return setOp * existOp;
  };

  return (
    <group>
      {/* Highlight: connecting capsules along each highlighted bond.
          These render BEFORE atom-halo spheres so all yellow geometry shares
          one render pass. */}
      {highlightBonds.map((b, i) => {
        const op = highlightBondOpacityFor(b);
        if (op < 0.02) return null;
        return (
          <HighlightBond
            key={`hb-${i}`}
            from={posForKey(b.a)}
            to={posForKey(b.b)}
            opacity={op}
          />
        );
      })}

      {/* Highlight: spheres at every highlighted atom */}
      {[...allHighlightKeys].map((key) => {
        const op = highlightOpacityFor(key);
        if (op < 0.02) return null;
        const a = byKey[key];
        if (!a) return null;
        const sourceAtom = a.kind === 'exit' ? a.from : a.to;
        return (
          <HighlightSphere
            key={`hs-${key}`}
            pos={posForKey(key)}
            el={sourceAtom.el}
            opacity={op}
          />
        );
      })}

      {/* Atoms */}
      {tween.atoms.map((a) => {
        let pos, opacity, scale;
        if (a.kind === 'persist') {
          pos = lerpVec(a.from.pos, a.to.pos, moveT);
          opacity = 1;
          scale = 1;
        } else if (a.kind === 'enter') {
          // Approach phase only — atom is fully present at enterT = 0.7,
          // then it sits there while the bond fades in.
          pos = lerpVec(enterDrift(a.to.pos), a.to.pos, enterPosT);
          opacity = enterPosT;
          scale = 0.35 + 0.65 * enterPosT;
        } else {
          // Exit — atom stays in place at full opacity until the bond cleaves
          // (exitT < 0.3), then drifts away and fades.
          pos = lerpVec(a.from.pos, exitDrift(a.from.pos), exitPosT);
          opacity = 1 - exitPosT;
          scale = 1 - 0.45 * exitPosT;
        }
        const atomData = a.kind === 'exit' ? a.from : a.to;
        const atom = { ...atomData, pos };
        return (
          <AtomNode
            key={a.key}
            atom={atom}
            opacity={opacity}
            scale={Math.max(0.01, scale)}
            onHoverGroup={onHoverGroup}
          />
        );
      })}

      {/* Bonds */}
      {tween.bonds.map((b, i) => {
        const ref = b.to || b.from;
        const from = posForKey(ref.a);
        const to = posForKey(ref.b);

        let order;
        let opacity;
        if (b.kind === 'persist') {
          if (b.from.order === b.to.order) {
            order = b.from.order;
            opacity = 1;
          } else {
            // Bond order changes during the move phase — the second parallel
            // cylinder fades in (single→double) or out (double→single).
            const doubleOpacity = b.from.order === 2 ? 1 - moveT : moveT;
            return (
              <React.Fragment key={`bond-${i}`}>
                <BondMesh from={from} to={to} order={1} opacity={1} />
                {doubleOpacity > 0.02 && (
                  <BondMesh from={from} to={to} order={2} opacity={doubleOpacity} />
                )}
              </React.Fragment>
            );
          }
        } else if (b.kind === 'enter') {
          // Bond appears only AFTER the entering atom has reached its final
          // position — see enterBondT (last 30% of the enter phase). This
          // avoids the visual where a long bond contracts as the atom slides in.
          order = b.to.order;
          opacity = enterBondT;
        } else {
          // Exit — the bond breaks BEFORE the atom drifts away (first 30% of
          // the exit phase). After cleavage the leaving group floats off
          // unattached.
          order = b.from.order;
          opacity = 1 - exitBondT;
        }

        if (opacity < 0.02) return null;
        return (
          <BondMesh key={`bond-${i}`} from={from} to={to} order={order} opacity={opacity} />
        );
      })}
    </group>
  );
}

// ------------------------------------------------------------------
// Main viewer component — the molecule stays still unless the user drags.
// ------------------------------------------------------------------
export default function MoleculeViewer({ prevIndex, stepIndex, onTransitionEnd, onHoverGroup }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 11], fov: 38 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Transparent canvas — the surface from .stage-frame shows through. */}
      <ambientLight intensity={1.0} color="#ffffff" />
      <directionalLight position={[5, 6, 8]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[-4, -3, 6]} intensity={0.18} color="#e8eef2" />

      <TransitioningMolecule
        prevIndex={prevIndex}
        nextIndex={stepIndex}
        onHoverGroup={onHoverGroup}
        onDone={onTransitionEnd}
      />

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        enableDamping
        dampingFactor={0.1}
      />
    </Canvas>
  );
}
