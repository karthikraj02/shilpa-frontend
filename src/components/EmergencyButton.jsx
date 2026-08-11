import React from 'react';

const EmergencyButton = ({ onClick }) => {
  return (
    <button
      type="button"
      aria-label="Emergency Help"
      onClick={onClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#ff4d4d,#ff1a1a)',
        boxShadow: '0 6px 18px rgba(255,40,40,0.35), 0 0 18px rgba(255,20,20,0.45) inset',
        border: '2px solid rgba(255,255,255,0.08)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        color: '#fff',
        cursor: 'pointer'
      }}
    >
      <span style={{ transform: 'translateY(-1px)' }}>🚨</span>
    </button>
  );
};

export default EmergencyButton;
