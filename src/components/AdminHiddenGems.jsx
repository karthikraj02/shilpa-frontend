import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Gem, CheckCircle, XCircle, Trash2, Loader2, RefreshCw, MapPin, User } from 'lucide-react';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const STATUS_COLORS = {
    approved: { bg: 'rgba(16,185,129,0.1)', color: '#34d399', border: 'rgba(16,185,129,0.25)' },
    rejected: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    pending:  { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
};

const AdminHiddenGems = () => {
    const [gems, setGems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchGems = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/hidden-gems', authHeader());
            setGems(res.data);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchGems(); }, []);

    const approveGem = async (id) => {
        setActionId(id);
        try {
            const res = await axios.patch(`/api/admin/hidden-gems/${id}/approve`, {}, authHeader());
            setGems(g => g.map(x => x._id === id ? res.data : x));
        } catch { alert('Failed to approve gem'); }
        setActionId(null);
    };

    const rejectGem = async (id) => {
        setActionId(id);
        try {
            const res = await axios.patch(`/api/admin/hidden-gems/${id}/reject`, {}, authHeader());
            setGems(g => g.map(x => x._id === id ? res.data : x));
        } catch { alert('Failed to reject gem'); }
        setActionId(null);
    };

    const deleteGem = async (id) => {
        if (!window.confirm('Delete this hidden gem submission?')) return;
        setActionId(id);
        try {
            await axios.delete(`/api/admin/hidden-gems/${id}`, authHeader());
            setGems(g => g.filter(x => x._id !== id));
        } catch { alert('Failed to delete gem'); }
        setActionId(null);
    };

    const filtered = gems.filter(g => {
        const status = g.status || 'pending';
        if (filter === 'all') return true;
        return status === filter;
    });

    const counts = {
        all: gems.length,
        pending:  gems.filter(g => (g.status || 'pending') === 'pending').length,
        approved: gems.filter(g => g.status === 'approved').length,
        rejected: gems.filter(g => g.status === 'rejected').length,
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}><Gem size={22} style={{ marginRight: 10, color: '#3b82f6' }} />Approve Hidden Gems</h2>
                    <p style={styles.subtitle}>Community-submitted locations awaiting review</p>
                </div>
                <button onClick={fetchGems} style={styles.refreshBtn}><RefreshCw size={16} /></button>
            </div>

            {/* Filter Tabs */}
            <div style={styles.filterRow}>
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span style={styles.filterCount}>{counts[f]}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={styles.loading}><Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} /><span>Loading submissions…</span></div>
            ) : filtered.length === 0 ? (
                <div style={styles.empty}><Gem size={40} color="#334155" /><p>No {filter !== 'all' ? filter : ''} submissions</p></div>
            ) : (
                <div style={styles.grid}>
                    {filtered.map(gem => {
                        const status = gem.status || 'pending';
                        const sc = STATUS_COLORS[status] || STATUS_COLORS.pending;
                        const gemImage = gem.images && gem.images.length > 0 ? gem.images[0] : null;
                        return (
                            <div key={gem._id} style={styles.card}>
                                {gemImage && (
                                    <img src={gemImage} alt={gem.placeName || 'Hidden Gem'} style={styles.cardImg} onError={e => e.target.style.display = 'none'} />
                                )}
                                <div style={styles.cardBody}>
                                    <div style={styles.cardTopRow}>
                                        <h3 style={styles.gemName}>{gem.placeName || 'Unnamed Place'}</h3>
                                        <span style={{ ...styles.badge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                            {status}
                                        </span>
                                    </div>
                                    <p style={styles.gemLocation}>
                                        <MapPin size={12} style={{ marginRight: 4 }} />{gem.location || gem.city || '—'}
                                    </p>
                                    {gem.description && <p style={styles.gemDesc}>{gem.description.slice(0, 120)}{gem.description.length > 120 ? '…' : ''}</p>}
                                    <p style={styles.gemAuthor}>
                                        <User size={12} style={{ marginRight: 4 }} />
                                        Submitted by {gem.submittedBy?.name || gem.submittedBy?.username || 'Anonymous'}
                                    </p>
                                    <div style={styles.cardActions}>
                                        {status === 'pending' && (
                                            <>
                                                <button onClick={() => approveGem(gem._id)} style={styles.btnGreen} disabled={actionId === gem._id}>
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button onClick={() => rejectGem(gem._id)} style={styles.btnOrange} disabled={actionId === gem._id}>
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => deleteGem(gem._id)} style={styles.btnRed} disabled={actionId === gem._id}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '4px 0' },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    title: { color: '#f1f5f9', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', marginBottom: 4 },
    subtitle: { color: '#64748b', fontSize: 13 },
    refreshBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' },
    filterRow: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
    filterBtn: { padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#64748b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' },
    filterBtnActive: { background: 'rgba(0,85,255,0.12)', border: '1px solid rgba(0,85,255,0.35)', color: '#60a5fa' },
    filterCount: { background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1px 7px', fontSize: 11 },
    loading: { display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', padding: '40px 0', justifyContent: 'center' },
    empty: { textAlign: 'center', padding: '60px 0', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' },
    cardImg: { width: '100%', height: 150, objectFit: 'cover' },
    cardBody: { padding: 18 },
    cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    gemName: { color: '#e2e8f0', fontWeight: 600, fontSize: 15, flex: 1, marginRight: 8 },
    gemLocation: { color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', marginBottom: 8 },
    gemDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 1.6, marginBottom: 8 },
    gemAuthor: { color: '#475569', fontSize: 12, display: 'flex', alignItems: 'center', marginBottom: 14 },
    badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 },
    cardActions: { display: 'flex', gap: 8 },
    btnGreen: { padding: '7px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'Inter, sans-serif' },
    btnOrange: { padding: '7px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'Inter, sans-serif' },
    btnRed: { padding: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 'auto' },
};

export default AdminHiddenGems;
