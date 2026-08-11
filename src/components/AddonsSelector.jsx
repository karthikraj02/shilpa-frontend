import React, { useState } from 'react';

const AddonsSelector = ({ onConfirm }) => {
    const [mode, setMode] = useState(null); // 'individual' or 'bundle'
    const [selectedAddons, setSelectedAddons] = useState({});
    const [selectedBundle, setSelectedBundle] = useState(null);
    const [baggageKg, setBaggageKg] = useState(15); // default included

    const addons = [
        { id: 'baggage', icon: '🧳', name: 'Extra Baggage +15kg', desc: 'Total 30kg checked luggage allowance', price: 1500, color: '#3b82f6' },
        { id: 'meals', icon: '🍽️', name: 'In-transit Meals', desc: 'Hot vegetarian/non-veg meal + beverages', price: 500, color: '#f59e0b' },
        { id: 'pickup', icon: '🚗', name: 'Chauffeur Pickup', desc: 'AC car pickup from airport/station to hotel', price: 2000, color: '#8b5cf6' },
        { id: 'insurance', icon: '🛡️', name: 'Travel Insurance', desc: 'Trip cancellation + medical emergency cover', price: 800, color: '#10b981' },
        { id: 'wifi', icon: '📶', name: 'In-transit WiFi', desc: 'High-speed internet throughout journey', price: 400, color: '#06b6d4' },
        { id: 'lounge', icon: '🛋️', name: 'Lounge Access', desc: 'Premium departure lounge with refreshments', price: 1200, color: '#ec4899' }
    ];

    const bundles = [
        { id: 'lite', label: '🟢 Lite Pack', desc: 'No extras — travel light!', items: [], price: 0, color: '#10b981', savings: '' },
        { id: 'comfort', label: '🟡 Comfort Pack', desc: 'Baggage + Meals + WiFi', items: ['baggage', 'meals', 'wifi'], price: 1800, originalPrice: 2400, color: '#f59e0b', savings: 'Save ₹600!' },
        { id: 'premium', label: '🔴 Premium Pack', desc: 'Everything included!', items: ['baggage', 'meals', 'pickup', 'insurance', 'wifi', 'lounge'], price: 4800, originalPrice: 6400, color: '#ef4444', savings: 'Save ₹1600!' }
    ];

    const toggleAddon = (id) => {
        setSelectedAddons(prev => {
            const updated = { ...prev };
            if (updated[id]) { delete updated[id]; }
            else { updated[id] = true; }
            // Update baggage meter
            if (id === 'baggage') setBaggageKg(updated[id] ? 30 : 15);
            return updated;
        });
    };

    const totalAddonCost = Object.keys(selectedAddons).reduce((sum, id) => {
        const addon = addons.find(a => a.id === id);
        return sum + (addon ? addon.price : 0);
    }, 0);

    const handleConfirm = () => {
        if (mode === 'bundle') {
            const bundle = bundles.find(b => b.id === selectedBundle);
            onConfirm({
                type: 'bundle',
                name: bundle?.label || 'Lite',
                items: bundle?.items || [],
                cost: bundle?.price || 0
            });
        } else {
            const selected = Object.keys(selectedAddons).map(id => {
                const addon = addons.find(a => a.id === id);
                return { name: addon.name, cost: addon.price };
            });
            onConfirm({
                type: 'individual',
                items: selected,
                cost: totalAddonCost
            });
        }
    };

    return (
        <div style={{ marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 15px', color: 'var(--text-main)', fontSize: '16px' }}>🧳 Travel Extras</h4>
            
            {/* Mode selector */}
            {!mode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div onClick={() => setMode('bundle')}
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '14px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
                        <strong style={{ color: '#f59e0b', fontSize: '15px' }}>Smart Bundles</strong>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>Pre-made packs with savings up to ₹1600</p>
                    </div>
                    <div onClick={() => setMode('individual')}
                        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '14px', padding: '20px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎛️</div>
                        <strong style={{ color: '#6366f1', fontSize: '15px' }}>Pick & Choose</strong>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>Toggle individual extras with full control</p>
                    </div>
                </div>
            )}

            {/* Bundle Selection */}
            {mode === 'bundle' && (
                <div>
                    <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '12px', fontSize: '13px' }}>← Back to options</button>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${bundles.length}, 1fr)`, gap: '12px', marginBottom: '20px' }}>
                        {bundles.map(bundle => (
                            <div key={bundle.id} onClick={() => setSelectedBundle(bundle.id)}
                                style={{
                                    background: selectedBundle === bundle.id ? `linear-gradient(135deg, ${bundle.color}20, ${bundle.color}08)` : 'rgba(255,255,255,0.02)',
                                    border: selectedBundle === bundle.id ? `2px solid ${bundle.color}` : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '14px', padding: '18px', cursor: 'pointer', transition: 'all 0.3s',
                                    transform: selectedBundle === bundle.id ? 'scale(1.03)' : 'scale(1)',
                                    boxShadow: selectedBundle === bundle.id ? `0 8px 25px ${bundle.color}25` : 'none'
                                }}>
                                {bundle.savings && (
                                    <div style={{ background: bundle.color, color: '#fff', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', display: 'inline-block', marginBottom: '10px' }}>{bundle.savings}</div>
                                )}
                                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '5px' }}>{bundle.label}</div>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>{bundle.desc}</p>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: bundle.color }}>
                                    {bundle.price === 0 ? 'FREE' : `₹${bundle.price.toLocaleString()}`}
                                    {bundle.originalPrice && <span style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: '8px' }}>₹{bundle.originalPrice}</span>}
                                </div>
                                {bundle.items.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {bundle.items.map(itemId => {
                                            const addon = addons.find(a => a.id === itemId);
                                            return addon ? <span key={itemId} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '8px', color: 'var(--text-muted)' }}>{addon.icon} {addon.name.split(' ')[0]}</span> : null;
                                        })}
                                    </div>
                                )}
                                {selectedBundle === bundle.id && <div style={{ textAlign: 'center', marginTop: '10px', color: bundle.color, fontWeight: '700' }}>✅ Selected</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Individual Toggle Cards */}
            {mode === 'individual' && (
                <div>
                    <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '12px', fontSize: '13px' }}>← Back to options</button>

                    {/* Luggage Weight Meter */}
                    <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '15px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>🧳 Luggage Allowance</span>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: baggageKg >= 30 ? '#10b981' : '#f59e0b' }}>{baggageKg}kg / 30kg</span>
                        </div>
                        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(baggageKg / 30) * 100}%`, height: '100%', borderRadius: '6px',
                                background: baggageKg >= 30 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                transition: 'width 0.5s ease'
                            }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span>0kg</span><span>15kg (included)</span><span>30kg</span>
                        </div>
                    </div>

                    {/* Toggle addon cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                        {addons.map(addon => {
                            const active = !!selectedAddons[addon.id];
                            return (
                                <div key={addon.id} onClick={() => toggleAddon(addon.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        background: active ? `${addon.color}12` : 'rgba(255,255,255,0.02)',
                                        border: active ? `1px solid ${addon.color}55` : '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.3s'
                                    }}>
                                    <div style={{ fontSize: '28px', flex: '0 0 40px', textAlign: 'center' }}>{addon.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{addon.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{addon.desc}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flex: '0 0 80px' }}>
                                        <div style={{ fontWeight: '800', fontSize: '15px', color: addon.color }}>+₹{addon.price}</div>
                                    </div>
                                    {/* Toggle switch */}
                                    <div style={{
                                        width: '44px', height: '24px', borderRadius: '12px', flex: '0 0 44px',
                                        background: active ? addon.color : 'rgba(255,255,255,0.15)',
                                        position: 'relative', transition: 'background 0.3s'
                                    }}>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                                            position: 'absolute', top: '3px', left: active ? '23px' : '3px',
                                            transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Running total */}
                    {totalAddonCost > 0 && (
                        <div style={{ textAlign: 'right', marginBottom: '10px', fontSize: '16px', fontWeight: '700', color: 'var(--accent)' }}>
                            Extras Total: ₹{totalAddonCost.toLocaleString()}
                        </div>
                    )}
                </div>
            )}

            {/* Confirm / Skip */}
            {mode && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleConfirm}
                        style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#000', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.3s' }}>
                        {mode === 'bundle' ? (selectedBundle ? `Confirm ${bundles.find(b => b.id === selectedBundle)?.label}` : 'Select a bundle') : totalAddonCost > 0 ? `Confirm Extras (₹${totalAddonCost.toLocaleString()})` : 'Continue without extras'}
                    </button>
                </div>
            )}

            {/* Skip button when no mode selected */}
            {!mode && (
                <button onClick={() => onConfirm({ type: 'none', items: [], cost: 0 })}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                    ⏭️ Skip — No Extras
                </button>
            )}
        </div>
    );
};

export default AddonsSelector;
