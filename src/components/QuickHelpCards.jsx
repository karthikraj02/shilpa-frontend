import React from 'react';

const cards = [
  { key: 'lost_wallet', label: 'Lost Wallet', emoji: '🎒' },
  { key: 'lost_passport', label: 'Lost Passport', emoji: '🛂' },
  { key: 'medical_help', label: 'Medical Help', emoji: '🩺' },
  { key: 'transport_problem', label: 'Transport Problem', emoji: '🚆' },
  { key: 'safety_concern', label: 'Safety Concern', emoji: '⚠️' }
];

const QuickHelpCards = ({ onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', overflowX: 'auto' }}>
      {cards.map(c => (
        <button key={c.key} onClick={() => onSelect(c.key)} className="btn" style={{ padding: '8px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-main)', fontWeight: '600' }}>
          {c.emoji} {c.label}
        </button>
      ))}
    </div>
  );
};

export default QuickHelpCards;
