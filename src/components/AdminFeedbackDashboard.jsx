import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StatCard = ({ title, value }) => (
  <div style={{ flex: '1 1 180px', padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
    <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.7)', marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
  </div>
);

const AdminFeedbackDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/feedback/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load feedback stats', err);
      }
    };
    load();
  }, []);

  if (!stats) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading feedback stats...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: 'var(--text-main)' }}>Feedback Dashboard</h2>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <StatCard title="Total Ratings" value={stats.total} />
        <StatCard title="Average Rating" value={stats.avgRating} />
        <StatCard title="Positive Feedback (>=4)" value={stats.positive} />
        <StatCard title="Negative Feedback (<=2)" value={stats.negative} />
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Most Common Tags</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stats.commonTags && stats.commonTags.length > 0 ? stats.commonTags.map(t => (
            <div key={t._id} style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', color: 'rgba(230,238,248,0.9)' }}>{t._id} ({t.count})</div>
          )) : <div style={{ color: 'var(--text-muted)' }}>No tags yet</div>}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Most Common Words In Comments</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stats.commonWords && stats.commonWords.length > 0 ? stats.commonWords.map(w => (
            <div key={w.word} style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', color: 'rgba(230,238,248,0.9)' }}>{w.word} ({w.count})</div>
          )) : <div style={{ color: 'var(--text-muted)' }}>No comments yet</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedbackDashboard;
