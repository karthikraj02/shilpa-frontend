import React, { useState, useEffect, useRef } from 'react';

const presetOptions = [
  { key: 'lost_wallet', label: '👛 Lost Wallet' },
  { key: 'lost_passport', label: '🛂 Lost Passport' },
  { key: 'medical_help', label: '🏥 Medical Emergency' },
  { key: 'transport_problem', label: '🚆 Transport Problem' },
  { key: 'safety_concern', label: '⚠️ Safety Concern' },
  { key: 'other', label: '✍️ Other Emergency' }
];

const EmergencyModal = ({ visible, onClose, onSubmit }) => {
  const [selected, setSelected] = useState('');
  const [custom, setCustom] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setSelected('');
      setCustom('');
      setTimeout(() => inputRef.current && inputRef.current.focus(), 120);
    }
  }, [visible]);

  if (!visible) return null;

  const handleOption = (opt) => {
    setSelected(opt);
    if (opt !== 'other') {
      const mapping = {
        lost_wallet: 'I lost my wallet while travelling. What should I do?',
        lost_passport: 'I lost my passport. How can I get emergency travel documents?',
        medical_help: 'I need immediate medical assistance. Please advise and find nearby hospitals.',
        transport_problem: 'My train/flight was cancelled or missed. What are my options?',
        safety_concern: 'I feel unsafe or threatened in this area and need immediate help.'
      };
      const q = mapping[opt] || 'I need emergency help.';
      onSubmit(q);
    } else {
      // focus input for custom
      setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    }
  };

  const handleSendCustom = () => {
    const q = custom.trim();
    if (!q) return;
    onSubmit(q);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

      <div style={{
        width: 'min(720px, 96%)',
        borderRadius: 14,
        padding: 18,
        background: 'linear-gradient(180deg, rgba(10,12,20,0.95), rgba(6,8,14,0.95))',
        backdropFilter: 'blur(8px) saturate(120%)',
        WebkitBackdropFilter: 'blur(8px) saturate(120%)',
        boxShadow: '0 10px 40px rgba(2,6,23,0.8)',
        border: '1px solid rgba(37,99,235,0.12)',
        color: '#e6eef8'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Emergency Assistance</div>
            <div style={{ fontSize: 13, color: 'rgba(230,238,248,0.7)' }}>Choose an emergency type or type your own. AI will provide step-by-step guidance.</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(230,238,248,0.8)', fontSize: 20, cursor: 'pointer' }}>✖</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {presetOptions.map(o => (
            <button
              key={o.key}
              onClick={() => handleOption(o.key)}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: selected === o.key ? 'linear-gradient(90deg,#2b6cff88,#4e8bff88)' : 'rgba(255,255,255,0.03)',
                border: selected === o.key ? '1px solid rgba(78,139,255,0.35)' : '1px solid rgba(255,255,255,0.04)',
                color: '#e6eef8',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <input
            ref={inputRef}
            placeholder="Describe your emergency or type additional details..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendCustom(); }}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#e6eef8'
            }}
          />
          <button onClick={handleSendCustom} style={{ padding: '10px 14px', borderRadius: 10, background: 'linear-gradient(135deg,#ff4d4d,#ff1a1a)', color: '#fff', border: 'none', cursor: 'pointer' }}>Send</button>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.6)' }}>
          Tip: For urgent medical or safety issues, please contact local emergency services immediately and then use this assistant for guidance and nearby resources.
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
