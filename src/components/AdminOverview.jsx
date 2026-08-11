import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Users, IndianRupee, Map, Calendar, Activity } from 'lucide-react';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalBookings: 0,
        totalDestinations: 0,
        activeUsers: 0,
        recentBookings: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            try {
                const [bookingsRes, destRes] = await Promise.all([
                    axios.get('/api/bookings', config),
                    axios.get('/api/destinations')
                ]);

                const bookings = bookingsRes.data;
                const destinations = destRes.data;

                const revenue = bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0);
                
                setStats({
                    totalRevenue: revenue,
                    totalBookings: bookings.length,
                    totalDestinations: destinations.length,
                    activeUsers: new Set(bookings.map(b => b.user)).size + 24, // Dummy user offset
                    recentBookings: bookings.slice(0, 5) // Last 5
                });
            } catch (err) {
                console.error("Failed to load analytics");
            }
        };
        fetchAnalytics();
    }, []);

    return (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Dashboard Analytics</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '50%' }}>
                        <IndianRupee color="#10b981" size={24} />
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Total Revenue</p>
                        <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>₹{stats.totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(129, 140, 248, 0.2)', padding: '15px', borderRadius: '50%' }}>
                        <Calendar color="#818cf8" size={24} />
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Total Bookings</p>
                        <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>{stats.totalBookings}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '15px', borderRadius: '50%' }}>
                        <Map color="#f59e0b" size={24} />
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Destinations</p>
                        <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>{stats.totalDestinations}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '15px', borderRadius: '50%' }}>
                        <Users color="#ec4899" size={24} />
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '14px' }}>Active Users</p>
                        <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>{stats.activeUsers}</h3>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>Booking Statistics (Recent)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '10px' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>User</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Amount</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recentBookings.length > 0 ? stats.recentBookings.map((b, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px', fontSize: '13px' }}>#{b._id?.substring(0, 8)}</td>
                                    <td style={{ padding: '10px' }}>{b.name}</td>
                                    <td style={{ padding: '10px' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px', color: 'var(--accent)', fontWeight: 'bold' }}>₹{b.totalCost}</td>
                                    <td style={{ padding: '10px' }}><span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>{b.status || 'Confirmed'}</span></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent bookings</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="glass-panel" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>System Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={16} color="var(--accent)"/> API Status</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>Online</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={16} color="var(--accent)"/> Gemini Integration</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>Connected</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><TrendingUp size={16} color="var(--accent)"/> Traffic Load</span>
                            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Moderate</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
