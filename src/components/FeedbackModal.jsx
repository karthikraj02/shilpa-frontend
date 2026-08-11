import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

const options = [
  { key: 'excellent', emoji: '😊', label: 'Excellent' },
  { key: 'loved', emoji: '😍', label: 'Loved It' },
  { key: 'helpful', emoji: '💡', label: 'Helpful' },
  { key: 'amazing', emoji: '🚀', label: 'Amazing Suggestions' },
  { key: 'issue', emoji: '🐞', label: 'Report Issue' }
];

const FeedbackModal = ({ visible, onClose, afterSubmit }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState('');
  const [comment, setComment] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    if (visible) {
      setRating(5); setHover(0); setSelectedOpt(''); setComment(''); setScreenshotFile(null); setScreenshotPreview(''); setSubmitting(false); setSubmitted(false); setAiSummary('');
    }
  }, [visible]);

  if (!visible) return null;

  const handleFile = (file) => {
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result.toString());
    reader.readAsDataURL(file);
  };

  const generateAISummary = (payload) => {
    // Lightweight, client-side "AI" summary to avoid external calls.
    const parts = [];
    parts.push(`Rating: ${payload.rating}/5`);
    if (payload.quickTags && payload.quickTags.length) parts.push(`Tags: ${payload.quickTags.join(', ')}`);
    if (payload.comment) parts.push(`Comment: ${payload.comment.slice(0, 180)}${payload.comment.length>180? '...':''}`);
    return `Thanks! Here's a quick summary:\n${parts.join('\n')}`;
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      const quickTags = selectedOpt ? [selectedOpt] : [];
      const metadata = {};
      if (screenshotPreview) metadata.screenshot = screenshotPreview;
      const payload = { rating, comment: comment || '', quickTags, metadata };
      const res = await axios.post('/api/feedback', payload);
      setSubmitting(false);
      setSubmitted(true);
      const summary = generateAISummary(payload);
      setAiSummary(summary);
      if (afterSubmit) afterSubmit(res.data);
      // Keep modal open to show success animation and summary, then auto-close after a short delay
      setTimeout(() => {
        // leave a brief pause for user to read summary, then close
        onClose();
      }, 2800);
    } catch (err) {
      console.error('Feedback submit error', err);
      setSubmitting(false);
      alert('Failed to submit feedback.');
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 10060, padding: '40px 16px', overflowY: 'auto' }}>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)' }} />

      <div style={{ position: 'relative', margin: '0 auto', width: 'min(760px,96%)', borderRadius: 16, padding: 20, background: 'linear-gradient(180deg, rgba(10,12,20,0.95), rgba(6,8,14,0.95))', backdropFilter: 'blur(10px) saturate(140%)', color: '#e6eef8', boxShadow: '0 20px 60px rgba(2,6,23,0.8)', border: '1px solid rgba(37,99,235,0.12)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', boxShadow: '0 8px 30px rgba(59,130,246,0.22)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="uninvert" style={{ fontSize: 36 }}>🤖</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>How was your chat experience?</div>
            <div style={{ fontSize: 13, color: 'rgba(230,238,248,0.7)' }}>Your feedback helps improve the AI assistant.</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(230,238,248,0.8)', fontSize: 20, cursor: 'pointer' }}>✖</button>
        </div>

        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 18 }}>
            <div style={{ width: 110, height: 110, borderRadius: 60, background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(59,130,246,0.25)' }}>
              <svg width="70" height="70" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
                <path d="M14 25.5L21 32L34 18" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Thank you — feedback submitted</div>
            <div style={{ maxWidth: 620, textAlign: 'center', color: 'rgba(230,238,248,0.85)' }}>{aiSummary.split('\n').map((s,i)=>(<div key={i}>{s}</div>))}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 18, flexDirection: 'column' }}>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} style={{ cursor: 'pointer', transform: (hover>=i || rating>=i) ? 'scale(1.15)' : 'scale(1)', transition: 'transform 180ms', filter: (hover>=i || rating>=i) ? 'drop-shadow(0 8px 22px rgba(59,130,246,0.28))' : 'none' }}>
                  <div className="uninvert" style={{ fontSize: 44, color: (hover>=i || rating>=i) ? '#ffd166' : 'rgba(255,255,255,0.12)', transition: 'color 180ms' }}>★</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
              {options.map(o => (
                <div key={o.key} onClick={() => setSelectedOpt(o.key)} style={{ minWidth: 140, padding: '14px 16px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', border: selectedOpt===o.key ? '2px solid rgba(59,130,246,0.9)' : '1px solid rgba(255,255,255,0.04)', background: selectedOpt===o.key ? 'linear-gradient(90deg, rgba(59,130,246,0.12), rgba(99,102,241,0.06))' : 'rgba(255,255,255,0.02)', boxShadow: selectedOpt===o.key ? '0 10px 30px rgba(59,130,246,0.12)' : 'none' }}>
                  <div className="uninvert" style={{ fontSize: 26 }}>{o.emoji}</div>
                  <div style={{ marginTop: 8, fontWeight: 700 }}>{o.label}</div>
                </div>
              ))}
            </div>

            <div>
              <textarea placeholder="Tell us more (optional)" value={comment} onChange={(e)=>setComment(e.target.value)} style={{ width: '100%', minHeight: 80, padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.04)', color: '#e6eef8', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e)=>handleFile(e.target.files && e.target.files[0])} />
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', color: '#e6eef8', cursor: 'pointer' }}>📷 Upload screenshot</div>
                </label>
                {screenshotPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={screenshotPreview} alt="preview" style={{ width: 72, height: 52, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }} />
                    <button onClick={() => { setScreenshotPreview(''); setScreenshotFile(null); }} style={{ background: 'transparent', border: 'none', color: 'rgba(230,238,248,0.7)', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(230,238,248,0.8)' }}>Cancel</button>
                <button onClick={submit} className="btn" disabled={submitting} style={{ padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#06b6d4,#3b82f6)', color: '#fff', fontWeight: 700 }}>{submitting ? 'Sending...' : 'Submit Feedback'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FeedbackModal;
