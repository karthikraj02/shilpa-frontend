import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Trash2, CheckCircle, Loader2, RefreshCw, MessageSquare } from 'lucide-react';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const StarRating = ({ value }) => (
    <span style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={13} fill={i <= value ? '#f59e0b' : 'none'} color={i <= value ? '#f59e0b' : '#334155'} />
        ))}
    </span>
);

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [filter, setFilter] = useState('all'); // all | pending | approved

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/reviews', authHeader());
            setReviews(res.data);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchReviews(); }, []);

    const approveReview = async (id) => {
        setActionId(id);
        try {
            const res = await axios.patch(`/api/admin/reviews/${id}/approve`, {}, authHeader());
            setReviews(r => r.map(x => x._id === id ? { ...x, approved: res.data.approved } : x));
        } catch { alert('Failed to approve review'); }
        setActionId(null);
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Delete this review?')) return;
        setActionId(id);
        try {
            await axios.delete(`/api/admin/reviews/${id}`, authHeader());
            setReviews(r => r.filter(x => x._id !== id));
        } catch { alert('Failed to delete review'); }
        setActionId(null);
    };

    const filtered = reviews.filter(r => {
        if (filter === 'approved') return r.approved;
        if (filter === 'pending') return !r.approved;
        return true;
    });

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}><MessageSquare size={22} style={{ marginRight: 10, color: '#3b82f6' }} />Manage Reviews</h2>
                    <p style={styles.subtitle}>{reviews.length} total reviews</p>
                </div>
                <button onClick={fetchReviews} style={styles.refreshBtn}><RefreshCw size={16} /></button>
            </div>

            {/* Filter Tabs */}
            <div style={styles.filterRow}>
                {['all', 'pending', 'approved'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span style={styles.filterCount}>
                            {f === 'all' ? reviews.length : f === 'approved' ? reviews.filter(r => r.approved).length : reviews.filter(r => !r.approved).length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={styles.loading}><Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} /><span>Loading reviews…</span></div>
            ) : filtered.length === 0 ? (
                <div style={styles.empty}><MessageSquare size={40} color="#334155" /><p>No reviews found</p></div>
            ) : (
                <div style={styles.grid}>
                    {filtered.map(review => (
                        <div key={review._id} style={styles.card}>
                            <div style={styles.cardTop}>
                                <div>
                                    <div style={styles.reviewAuthor}>{review.username || 'Anonymous'}</div>
                                    <div style={styles.reviewDest}>{review.placeName || '—'}</div>
                                </div>
                                <span style={{ ...styles.badge, ...(review.approved ? styles.badgeGreen : styles.badgeYellow) }}>
                                    {review.approved ? 'Approved' : 'Pending'}
                                </span>
                            </div>
                            <StarRating value={review.rating || 0} />
                            <p style={styles.reviewText}>{review.reviewText || '—'}</p>
                            <div style={styles.cardFooter}>
                                <span style={styles.reviewDate}>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {!review.approved && (
                                        <button onClick={() => approveReview(review._id)} style={styles.btnGreen} disabled={actionId === review._id} title="Approve">
                                            <CheckCircle size={14} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteReview(review._id)} style={styles.btnRed} disabled={actionId === review._id} title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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
    filterRow: { display: 'flex', gap: 8, marginBottom: 24 },
    filterBtn: { padding: '7px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, color: '#64748b', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' },
    filterBtnActive: { background: 'rgba(0,85,255,0.12)', border: '1px solid rgba(0,85,255,0.35)', color: '#60a5fa' },
    filterCount: { background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1px 7px', fontSize: 11 },
    loading: { display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', padding: '40px 0', justifyContent: 'center' },
    empty: { textAlign: 'center', padding: '60px 0', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    reviewAuthor: { color: '#e2e8f0', fontWeight: 600, fontSize: 14 },
    reviewDest: { color: '#64748b', fontSize: 12, marginTop: 2 },
    reviewText: { color: '#94a3b8', fontSize: 14, lineHeight: 1.6, flex: 1 },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    reviewDate: { color: '#475569', fontSize: 12 },
    badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
    badgeGreen: { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' },
    badgeYellow: { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' },
    btnGreen: { padding: '7px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    btnRed: { padding: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' },
};

export default AdminReviews;
