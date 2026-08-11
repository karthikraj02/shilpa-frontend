import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewsSection from './ReviewsSection';

const tagStyle = (color) => ({
    background: color, color: '#fff', padding: '3px 10px', borderRadius: '12px',
    fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase'
});

const TransportCards = ({ from, to, type, onBook }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [expandedReviews, setExpandedReviews] = useState({});

    const toggleReviews = (id) => {
        setExpandedReviews(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`/api/transports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&type=${type}`)
            .then(res => { setResults(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [from, to, type]);

    const filtered = activeFilter === 'cheapest' ? [...results].sort((a,b) => a.price - b.price)
        : activeFilter === 'fastest' ? [...results].sort((a,b) => parseDur(a.duration) - parseDur(b.duration))
        : activeFilter === 'rating' ? [...results].sort((a,b) => b.rating - a.rating)
        : results;

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>🔍 Finding best {type} options from {from} to {to}...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (results.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No {type} options found for this route.</p>;

    const icon = type === 'flight' ? '✈️' : type === 'bus' ? '🚌' : '🚂';

    return (
        <div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                {['all', 'cheapest', 'fastest', 'rating'].map(f => (
                    <button key={f} onClick={() => setActiveFilter(f)}
                        style={{ padding: '6px 16px', borderRadius: '20px', border: activeFilter === f ? '2px solid var(--accent)' : '1px solid var(--border)', background: activeFilter === f ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', color: activeFilter === f ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', transition: 'all 0.3s' }}>
                        {f === 'all' ? '🔄 All' : f === 'cheapest' ? '💰 Cheapest' : f === 'fastest' ? '⚡ Fastest' : '⭐ Top Rated'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filtered.map((t, i) => (
                    <div key={i} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', transition: 'all 0.35s ease', cursor: 'default', position: 'relative', overflow: 'hidden', animation: `fadeInUp 0.5s ease-out ${i * 0.1}s both` }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(16,185,129,0.15)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

                        {/* Smart tags */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {t.isCheapest && <span style={tagStyle('#059669')}>💰 Cheapest</span>}
                            {t.isFastest && <span style={tagStyle('#2563eb')}>⚡ Fastest</span>}
                            {t.isBestValue && <span style={tagStyle('#d97706')}>🏆 Best Value</span>}
                            {type === 'flight' && t.flightType && <span style={tagStyle('#7c3aed')}>{t.flightType}</span>}
                            {type === 'bus' && t.acType && <span style={tagStyle(t.acType === 'AC' ? '#0891b2' : '#64748b')}>{t.acType} {t.seatType}</span>}
                            {type === 'train' && t.coachType && <span style={tagStyle('#7c3aed')}>{t.coachType}</span>}
                        </div>

                        {/* Main row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            {/* Operator info */}
                            <div style={{ flex: '0 0 160px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '3px' }}>{icon} {t.name}</div>
                                {t.number && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>#{t.number}</div>}
                                {t.airline && <div style={{ fontSize: '12px', color: 'var(--accent)' }}>{t.airline}</div>}
                            </div>

                            {/* Timeline */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{t.departureTime}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.fromStation || from}</div>
                                    {type === 'train' && t.platform && <div style={{ fontSize: '10px', color: 'var(--accent)' }}>Platform {t.platform}</div>}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', marginBottom: '4px' }}>{t.duration}</div>
                                    <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '-3px', left: 0, width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                        <div style={{ position: 'absolute', top: '-3px', right: 0, width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{type === 'bus' && t.boardingPoint ? `From: ${t.boardingPoint}` : ''}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{t.arrivalTime}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.toStation || to}</div>
                                </div>
                            </div>

                            {/* Price + Book */}
                            <div style={{ textAlign: 'right', flex: '0 0 130px' }}>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>₹{t.price.toLocaleString()}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>per person</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <span style={{ color: '#facc15', fontSize: '14px' }}>★</span>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{t.rating}</span>
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>|</span>
                                    <button 
                                        onClick={() => toggleReviews(t._id || t.name)}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: 0 }}
                                    >
                                        Reviews
                                    </button>
                                </div>
                                <div style={{ fontSize: '11px', color: t.availableSeats <= 10 ? '#ef4444' : 'var(--text-muted)', fontWeight: t.availableSeats <= 10 ? '700' : '400', marginBottom: '10px' }}>
                                    {t.availableSeats <= 10 ? `🔥 Only ${t.availableSeats} left!` : `${t.availableSeats} seats available`}
                                </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <button onClick={() => onBook && onBook(t)}
                                            style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.3s', width: '100%' }}
                                            onMouseEnter={e => { e.target.style.transform = 'scale(1.03)'; e.target.style.boxShadow = '0 4px 15px rgba(16,185,129,0.4)'; }}
                                            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}>
                                            Add to Trip
                                        </button>
                                        <a href={
                                            type === 'flight' ? `https://www.makemytrip.com/flights/` : 
                                            type === 'bus' ? `https://www.redbus.in/bus-tickets/${encodeURIComponent(from)}-to-${encodeURIComponent(to)}` : 
                                            `https://www.irctc.co.in/nget/train-search`
                                        } target="_blank" rel="noreferrer"
                                            style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box' }}
                                            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
                                            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}>
                                            Verify on Official Site ↗
                                        </a>
                                    </div>
                                </div>
                        </div>

                        {/* Expandable Review panel */}
                        {expandedReviews[t._id || t.name] && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'left' }}>
                                <ReviewsSection 
                                    entityId={t._id || t.name} 
                                    entityType="transport" 
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

function parseDur(d) {
    const m = d.match(/(\d+)h\s*(\d*)m?/);
    return m ? parseInt(m[1]) * 60 + (parseInt(m[2]) || 0) : 999;
}

export default TransportCards;
