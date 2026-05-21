// For each step (0..8), the atom keys that belong to the functional group
// being changed (or about to change) at that step. The renderer paints a soft
// transparent "highlighter" sprite behind every listed atom so the user can
// pick out the part of the molecule that's the focus of the transformation.

export const HIGHLIGHTS = {
  // Step 0 — OAA at rest. The C2 ketone is the reactive site that
  //          Acetyl-CoA will attack in stage 1.
  0: ['cit_c3', 'oaa_c3_ketO'],

  // Step 1 — Citrate. Highlight the new central tertiary group:
  //          the OH on cit_c3 and the branch carboxyl (cit_c6 + its O/H).
  1: ['cit_c3', 'cit_c3_oh', 'cit_c3_oh_H',
      'cit_c6', 'cit_c6_carbO', 'cit_c6_oh', 'cit_c6_oh_H'],

  // Step 2 — Isocitrate. The hydroxyl has migrated to cit_c4.
  2: ['cit_c4', 'iso_c4_oh', 'iso_c4_oh_H'],

  // Step 3 — α-Ketoglutarate. The new α-keto group on cit_c3.
  3: ['cit_c3', 'akg_c3_ketO'],

  // Step 4 — Succinyl-CoA. The new thioester to Coenzyme A.
  4: ['cit_c5', 'scoa_ketO', 'scoa_S', 'scoa_CoA'],

  // Step 5 — Succinate. The right-hand carboxyl that replaced the thioester.
  5: ['cit_c5', 'suc_Rcarb_carbO', 'suc_Rcarb_oh', 'suc_Rcarb_oh_H'],

  // Step 6 — Fumarate. The trans C=C double bond between cit_c3 and cit_c4.
  6: ['cit_c3', 'cit_c4'],

  // Step 7 — L-Malate. The new hydroxyl on cit_c3.
  7: ['cit_c3', 'mal_c3_oh', 'mal_c3_oh_H'],

  // Step 8 — Regenerated OAA. The α-keto carbonyl reformed from malate.
  8: ['cit_c3', 'oaa_c3_ketO'],
};

// (Element-specific highlight sphere/bond sizes now live in MoleculeViewer.jsx,
// where the unified mesh-based highlight is rendered. This file just declares
// which atoms belong to each step's active functional group.)
