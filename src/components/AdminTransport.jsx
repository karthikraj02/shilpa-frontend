import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bus, Trash2, Plus, Loader2, RefreshCw, X, Check } from 'lucide-react';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const emptyForm = { name: '', type: 'bus', from: '', to: '', price: '', duration: '', seats: '', description: '' };

const AdminTransport = () => {
    const [transports, setTransports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [actionId, setActionId] = useState(null);

    const fetchTransports = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/transports', authHeader());
            setTransports(res.data);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchTransports(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.post('/api/admin/transports', form, authHeader());
            setTransports(t => [res.data, ...t]);
            setForm(emptyForm);
            setShowForm(false);
        } catch { alert('Failed to add transport'); }
        setSaving(false);
    };

    const deleteTransport = async (id) => {
        if (!window.confirm('Delete this transport?')) return;
        setActionId(id);
        try {
            await axios.delete(`/api/admin/transports/${id}`, authHeader());
            setTransports(t => t.filter(x => x._id !== id));
        } catch { alert('Failed to delete transport'); }
        setActionId(null);
    };

    const typeColor = (type) => {
        const map = { bus: '#3b82f6', train: '#8b5cf6', flight: '#06b6d4', ferry: '#10b981', cab: '#f59e0b' };
        return map[type] || '#64748b';
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}><Bus size={22} style={{ marginRight: 10, color: '#3b82f6' }} />Manage Transport</h2>
                    <p style={styles.subtitle}>{transports.length} transport options</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={fetchTransports} style={styles.iconBtn}><RefreshCw size={16} /></button>
                    <button onClick={() => setShowForm(s => !s)} style={styles.addBtn}>
                        {showForm ? <X size={16} /> : <Plus size={16} />}
                        {showForm ? 'Cancel' : 'Add Transport'}
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGrid}>
                        {[
                            { key: 'name', label: 'Transport Name', placeholder: 'e.g. GoAir Express' },
                            { key: 'from', label: 'From', placeholder: 'Departure city' },
                            { key: 'to', label: 'To', placeholder: 'Destination city' },
                            { key: 'price', label: 'Price (₹)', placeholder: '0', type: 'number' },
                            { key: 'duration', label: 'Duration', placeholder: 'e.g. 2h 30m' },
                            { key: 'seats', label: 'Seats Available', placeholder: '0', type: 'number' },
                        ].map(({ key, label, placeholder, type = 'text' }) => (
                            <div key={key} style={styles.formGroup}>
                                <label style={styles.formLabel}>{label}</label>
                                <input
                                    type={type}
                                    placeholder={placeholder}
                                    value={form[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    style={styles.formInput}
                                />
                            </div>
                        ))}
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>Type</label>
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={styles.formInput}>
                                {['bus', 'train', 'flight', 'ferry', 'cab'].map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Description</label>
                        <textarea
                            placeholder="Optional description…"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            style={{ ...styles.formInput, resize: 'vertical', minHeight: 80 }}
                        />
                    </div>
                    <button type="submit" style={styles.saveBtn} disabled={saving}>
                        {saving ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Check size={15} />}
                        {saving ? 'Saving…' : 'Save Transport'}
                    </button>
                </form>
            )}

            {loading ? (
                <div style={styles.loading}><Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} /><span>Loading transports…</span></div>
            ) : transports.length === 0 ? (
                <div style={styles.empty}><Bus size={40} color="#334155" /><p>No transports yet. Add one above.</p></div>
            ) : (
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {['Name', 'Type', 'Route', 'Price', 'Duration', 'Seats', 'Actions'].map(h => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {transports.map(t => (
                                <tr key={t._id} style={styles.tr}>
                                    <td style={styles.td}><span style={{ color: '#e2e8f0', fontWeight: 500 }}>{t.name || '—'}</span></td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, color: typeColor(t.type), background: `${typeColor(t.type)}18`, border: `1px solid ${typeColor(t.type)}40` }}>
                                            {t.type || '—'}
                                        </span>
                                    </td>
                                    <td style={styles.td}><span style={{ color: '#94a3b8' }}>{t.from} → {t.to}</span></td>
                                    <td style={styles.td}><span style={{ color: '#34d399', fontWeight: 600 }}>₹{t.price || '—'}</span></td>
                                    <td style={styles.td}><span style={{ color: '#94a3b8' }}>{t.duration || '—'}</span></td>
                                    <td style={styles.td}><span style={{ color: '#94a3b8' }}>{t.seats ?? '—'}</span></td>
                                    <td style={styles.td}>
                                        <button onClick={() => deleteTransport(t._id)} style={styles.btnRed} disabled={actionId === t._id} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '4px 0' },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
    title: { color: '#f1f5f9', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', marginBottom: 4 },
    subtitle: { color: '#64748b', fontSize: 13 },
    iconBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' },
    addBtn: { padding: '9px 18px', background: 'rgba(0,85,255,0.15)', border: '1px solid rgba(0,85,255,0.35)', borderRadius: 10, color: '#60a5fa', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter, sans-serif' },
    form: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 24 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 14 },
    formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
    formLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 500 },
    formInput: { padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%' },
    saveBtn: { padding: '10px 20px', background: 'linear-gradient(135deg, #0055ff, #003db3)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter, sans-serif' },
    loading: { display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', padding: '40px 0', justifyContent: 'center' },
    empty: { textAlign: 'center', padding: '60px 0', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    tableWrap: { overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
    th: { padding: '12px 16px', background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 12, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    tr: { borderBottom: '1px solid rgba(255,255,255,0.04)' },
    td: { padding: '13px 16px', fontSize: 14 },
    badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' },
    btnRed: { padding: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' },
};

export default AdminTransport;
