import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Map, Bus, Calendar, MessageSquare,
    Gem, MessageCircle, BarChart2, LogOut, Shield, ChevronRight, Menu, X
} from 'lucide-react';

const navItems = [
    { to: '/admin/dashboard',                 label: 'Overview',         icon: LayoutDashboard, exact: true },
    { to: '/admin/dashboard/users',           label: 'Manage Users',     icon: Users },
    { to: '/admin/dashboard/destinations',    label: 'Destinations',     icon: Map },
    { to: '/admin/dashboard/transport',       label: 'Transport',        icon: Bus },
    { to: '/admin/dashboard/bookings',        label: 'Bookings',         icon: Calendar },
    { to: '/admin/dashboard/reviews',         label: 'Reviews',          icon: MessageSquare },
    { to: '/admin/dashboard/hidden-gems',     label: 'Hidden Gems',      icon: Gem },
    { to: '/admin/dashboard/feedback',        label: 'Feedback',         icon: MessageCircle },
    { to: '/admin/dashboard/tripplans',       label: 'Trip Plans',       icon: BarChart2 },
];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const adminName = localStorage.getItem('name') || localStorage.getItem('username') || 'Admin';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role  = localStorage.getItem('role');
        if (!token || role !== 'admin') {
            navigate('/admin/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        ['token', 'role', 'username', 'name', 'email', 'profilePicture'].forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new Event('authChange'));
        navigate('/admin/login');
    };

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.to || location.pathname === `${item.to}/`;
        return location.pathname.startsWith(item.to);
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }

                .admin-layout {
                    display: flex;
                    min-height: 100vh;
                    background: #000;
                    font-family: 'Inter', sans-serif;
                    color: #f1f5f9;
                }

                /* ── Sidebar ── */
                .admin-sidebar {
                    width: 250px;
                    flex-shrink: 0;
                    background: rgba(8, 12, 28, 0.97);
                    border-right: 1px solid rgba(0, 85, 255, 0.18);
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                    z-index: 100;
                    transition: transform 0.3s ease;
                }

                .sidebar-brand {
                    padding: 28px 24px 20px;
                    border-bottom: 1px solid rgba(0, 85, 255, 0.12);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .sidebar-brand-icon {
                    width: 40px; height: 40px;
                    background: linear-gradient(135deg, rgba(0,85,255,0.2), rgba(0,40,160,0.15));
                    border: 1px solid rgba(0,85,255,0.4);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 16px rgba(0,85,255,0.15);
                    flex-shrink: 0;
                }

                .sidebar-brand-text { flex: 1; min-width: 0; }
                .sidebar-brand-title { font-size: 14px; font-weight: 700; color: #f1f5f9; }
                .sidebar-brand-sub   { font-size: 11px; color: #475569; margin-top: 2px; }

                .sidebar-nav {
                    padding: 16px 12px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .nav-section-label {
                    font-size: 10px;
                    font-weight: 600;
                    color: #334155;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 12px 12px 6px;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: 10px;
                    color: #64748b;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.18s;
                    position: relative;
                    cursor: pointer;
                }

                .nav-link:hover {
                    background: rgba(0, 85, 255, 0.07);
                    color: #94a3b8;
                }

                .nav-link.active {
                    background: rgba(0, 85, 255, 0.13);
                    color: #60a5fa;
                    border: 1px solid rgba(0, 85, 255, 0.22);
                }

                .nav-link.active::before {
                    content: '';
                    position: absolute;
                    left: 0; top: 50%;
                    transform: translateY(-50%);
                    width: 3px; height: 20px;
                    background: #3b82f6;
                    border-radius: 0 3px 3px 0;
                }

                .sidebar-footer {
                    padding: 16px 12px;
                    border-top: 1px solid rgba(0, 85, 255, 0.1);
                }

                .admin-info-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    margin-bottom: 10px;
                }

                .admin-avatar {
                    width: 34px; height: 34px;
                    background: linear-gradient(135deg, #0055ff, #003db3);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 13px; font-weight: 700; color: #fff;
                    flex-shrink: 0;
                }

                .admin-info-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
                .admin-info-role { font-size: 11px; color: '#3b82f6'; }

                .logout-btn {
                    width: 100%;
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(239,68,68,0.07);
                    border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 10px;
                    color: #f87171;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.18s;
                    font-family: 'Inter', sans-serif;
                    text-align: left;
                }

                .logout-btn:hover {
                    background: rgba(239,68,68,0.13);
                    border-color: rgba(239,68,68,0.35);
                }

                /* ── Main content ── */
                .admin-main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                }

                .admin-topbar {
                    padding: 20px 32px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(8,12,24,0.6);
                    backdrop-filter: blur(12px);
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }

                .topbar-breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #64748b;
                    font-size: 14px;
                }

                .topbar-breadcrumb span:last-child { color: #e2e8f0; font-weight: 500; }

                .topbar-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0,85,255,0.1);
                    border: 1px solid rgba(0,85,255,0.25);
                    border-radius: 20px;
                    padding: 5px 14px;
                    font-size: 12px;
                    color: '#60a5fa';
                    font-weight: 600;
                }

                .admin-content {
                    padding: 32px;
                    flex: 1;
                    overflow-y: auto;
                }

                /* Mobile */
                .mobile-menu-btn {
                    display: none;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    borderRadius: 8px;
                    padding: 8px;
                    cursor: pointer;
                    color: #94a3b8;
                }

                .sidebar-overlay {
                    display: none;
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.7);
                    z-index: 99;
                }

                @media (max-width: 768px) {
                    .admin-sidebar {
                        position: fixed;
                        top: 0; left: 0; height: 100vh;
                        transform: translateX(-100%);
                        z-index: 200;
                    }
                    .admin-sidebar.open { transform: translateX(0); }
                    .mobile-menu-btn { display: flex; }
                    .admin-content { padding: 20px 16px; }
                    .admin-topbar { padding: 16px 20px; }
                    .sidebar-overlay.open { display: block; }
                }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="admin-layout">
                {/* Sidebar Overlay (mobile) */}
                <div
                    className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                />

                {/* Sidebar */}
                <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <Shield size={20} color="#3b82f6" strokeWidth={1.5} />
                        </div>
                        <div className="sidebar-brand-text">
                            <div className="sidebar-brand-title">Admin Panel</div>
                            <div className="sidebar-brand-sub">AI Tourist Assistant</div>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <div className="nav-section-label">Navigation</div>
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const active = isActive(item);
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`nav-link ${active ? 'active' : ''}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon size={17} />
                                    {item.label}
                                    {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="sidebar-footer">
                        <div className="admin-info-row">
                            <div className="admin-avatar">{adminName[0]?.toUpperCase() || 'A'}</div>
                            <div>
                                <div className="admin-info-name">{adminName}</div>
                                <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>● Administrator</div>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main */}
                <main className="admin-main">
                    {/* Topbar */}
                    <div className="admin-topbar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                                className="mobile-menu-btn"
                                onClick={() => setSidebarOpen(s => !s)}
                                style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                            <div className="topbar-breadcrumb">
                                <span>Admin</span>
                                <ChevronRight size={14} />
                                <span>{navItems.find(n => isActive(n))?.label || 'Dashboard'}</span>
                            </div>
                        </div>
                        <div className="topbar-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,85,255,0.1)', border: '1px solid rgba(0,85,255,0.25)', borderRadius: 20, padding: '5px 14px', fontSize: 12, color: '#60a5fa', fontWeight: 600 }}>
                            <Shield size={13} />
                            Secure Session
                        </div>
                    </div>

                    {/* Page content */}
                    <div className="admin-content">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
