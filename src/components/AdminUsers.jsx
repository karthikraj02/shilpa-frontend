import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Trash2, ShieldCheck, ShieldOff, Search, Loader2, RefreshCw, UserX, Mail, Calendar } from 'lucide-react';

const token = () => localStorage.getItem('token');
const authHeader = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionId, setActionId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/users', authHeader());
            setUsers(res.data);
        } catch { /* silent */ }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        setActionId(id);
        try {
            await axios.delete(`/api/admin/users/${id}`, authHeader());
            setUsers(u => u.filter(x => x._id !== id));
        } catch { alert('Failed to delete user'); }
        setActionId(null);
    };

    const changeRole = async (id, role) => {
        setActionId(id);
        try {
            const res = await axios.patch(`/api/admin/users/${id}/role`, { role }, authHeader());
            setUsers(u => u.map(x => x._id === id ? { ...x, role: res.data.role } : x));
        } catch { alert('Failed to update role'); }
        setActionId(null);
    };

    const filtered = users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}><Users size={22} style={{ marginRight: 10, color: '#3b82f6' }} />Manage Users</h2>
                    <p style={styles.subtitle}>{users.length} registered users</p>
                </div>
                <button onClick={fetchUsers} style={styles.refreshBtn} title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Search */}
            <div style={styles.searchWrap}>
                <Search size={16} style={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            {loading ? (
                <div style={styles.loading}><Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} /><span>Loading users…</span></div>
            ) : filtered.length === 0 ? (
                <div style={styles.empty}><UserX size={40} color="#334155" /><p>No users found</p></div>
            ) : (
                <div style={styles.tableWrap}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                    <th key={h} style={styles.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => (
                                <tr key={user._id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {user.profilePicture
                                                ? <img src={user.profilePicture} alt="" style={styles.avatar} />
                                                : <div style={styles.avatarFallback}>{(user.name || user.email || 'U')[0].toUpperCase()}</div>
                                            }
                                            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{user.name || user.username || '—'}</span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Mail size={13} />{user.email || '—'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.badge, ...(user.role === 'admin' ? styles.badgeAdmin : styles.badgeUser) }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Calendar size={13} />
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {user.role === 'user' ? (
                                                <button
                                                    onClick={() => changeRole(user._id, 'admin')}
                                                    style={styles.actionBtnBlue}
                                                    disabled={actionId === user._id}
                                                    title="Promote to Admin"
                                                >
                                                    <ShieldCheck size={14} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => changeRole(user._id, 'user')}
                                                    style={styles.actionBtnGray}
                                                    disabled={actionId === user._id}
                                                    title="Demote to User"
                                                >
                                                    <ShieldOff size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteUser(user._id)}
                                                style={styles.actionBtnRed}
                                                disabled={actionId === user._id}
                                                title="Delete user"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
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
    refreshBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' },
    searchWrap: { position: 'relative', marginBottom: 20 },
    searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' },
    searchInput: { width: '100%', padding: '11px 14px 11px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' },
    loading: { display: 'flex', alignItems: 'center', gap: 12, color: '#64748b', padding: '40px 0', justifyContent: 'center' },
    empty: { textAlign: 'center', padding: '60px 0', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
    tableWrap: { overflowX: 'auto', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: 600 },
    th: { padding: '12px 16px', background: 'rgba(255,255,255,0.04)', color: '#64748b', fontSize: 12, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
    tr: { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
    td: { padding: '14px 16px', fontSize: 14 },
    avatar: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,85,255,0.3)' },
    avatarFallback: { width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #0055ff, #003db3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' },
    badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
    badgeUser: { background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.25)' },
    badgeAdmin: { background: 'rgba(0,85,255,0.12)', color: '#60a5fa', border: '1px solid rgba(0,85,255,0.3)' },
    actionBtnBlue: { padding: '7px', background: 'rgba(0,85,255,0.1)', border: '1px solid rgba(0,85,255,0.25)', borderRadius: 8, color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    actionBtnGray: { padding: '7px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    actionBtnRed: { padding: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' },
};

export default AdminUsers;
