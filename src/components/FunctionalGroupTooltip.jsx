import React from 'react';

const GROUP_TITLES = {
  carboxyl: 'Carboxyl group (–COOH)',
  hydroxyl: 'Hydroxyl (–OH)',
  ketone: 'Ketone (C=O)',
  thioester: 'Thioester bond (C(=O)–S)',
  CoA: 'Coenzyme A',
};

export default function FunctionalGroupTooltip({ hover }) {
  if (!hover || !hover.atom) return null;
  const { atom, x, y } = hover;
  const title = GROUP_TITLES[atom.group] || atom.group;

  return (
    <div className="molecule-tooltip" style={{ left: x, top: y }}>
      <div className="tooltip-title">{title}</div>
      <div className="tooltip-role">{atom.role}</div>
    </div>
  );
}
