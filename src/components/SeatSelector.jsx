import React, { useState } from 'react';

const SeatSelector = ({ transportType, onSelect }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSeat, setSelectedSeat] = useState(null);

    // Class comparison data
    const classOptions = transportType === 'flight' ? [
        { id: 'economy', label: 'Economy', price: 0, icon: '💺', color: '#3b82f6', amenities: ['Standard legroom', '15kg baggage', 'Snack included'], img: '🛫' },
        { id: 'business', label: 'Business', price: 8000, icon: '👑', color: '#f59e0b', amenities: ['Extra legroom', '25kg baggage', 'Free meal', 'Priority boarding', 'Lounge access'], img: '🥂' },
        { id: 'first', label: 'First Class', price: 20000, icon: '💎', color: '#a855f7', amenities: ['Flat bed seat', '40kg baggage', 'Gourmet dining', 'Lounge + Spa', 'Champagne', 'Personal screen'], img: '✨' }
    ] : transportType === 'train' ? [
        { id: 'sleeper', label: 'Sleeper', price: 0, icon: '🛏️', color: '#3b82f6', amenities: ['Standard berth', 'Fan cooled', 'No meals'], img: '🚂' },
        { id: 'ac3', label: 'AC 3-Tier', price: 1500, icon: '❄️', color: '#06b6d4', amenities: ['AC berth', 'Bedding provided', 'Charging point'], img: '🧊' },
        { id: 'ac2', label: 'AC 2-Tier', price: 3000, icon: '👑', color: '#f59e0b', amenities: ['Spacious AC berth', 'Privacy curtain', 'Bedding + Pillow', 'Meals available'], img: '🥇' },
        { id: 'ac1', label: '1st AC Coupe', price: 5000, icon: '💎', color: '#a855f7', amenities: ['Private cabin', 'Full AC', 'Bedding + Towel', 'Complimentary meals', 'Attendant service'], img: '🏆' }
    ] : [
        { id: 'seater', label: 'Seater', price: 0, icon: '💺', color: '#3b82f6', amenities: ['Push-back seat', 'Charging point'], img: '🚌' },
        { id: 'semi', label: 'Semi-Sleeper', price: 300, icon: '🛋️', color: '#06b6d4', amenities: ['Reclining seat', 'Blanket', 'Charging point'], img: '😴' },
        { id: 'sleeper', label: 'AC Sleeper', price: 800, icon: '👑', color: '#f59e0b', amenities: ['Full flat berth', 'AC', 'Curtains', 'Blanket + Pillow'], img: '🌙' }
    ];

    // Seat map grid
    const generateSeatMap = () => {
        const rows = transportType === 'flight' ? 8 : 6;
        const cols = transportType === 'flight' ? 6 : transportType === 'train' ? 8 : 4;
        const seats = [];
        const takenSeats = new Set();
        // Randomly mark ~30% as taken
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() < 0.3) takenSeats.add(`${r}-${c}`);
            }
        }
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                const id = `${r}-${c}`;
                const taken = takenSeats.has(id);
                // Add aisle gap for flights (after col 2)
                if (transportType === 'flight' && c === 3) row.push({ type: 'aisle', id: `aisle-${r}` });
                row.push({ id, taken, label: `${String.fromCharCode(65 + c)}${r + 1}` });
            }
            seats.push(row);
        }
        return seats;
    };

    const seatMap = generateSeatMap();

    const handleConfirm = () => {
        if (!selectedClass) return;
        const cls = classOptions.find(c => c.id === selectedClass);
        onSelect({
            val: cls.label,
            extraCost: cls.price,
            seat: selectedSeat || 'Auto-assigned'
        });
    };

    return (
        <div style={{ marginTop: '10px' }}>
            {/* Class Comparison Cards */}
            <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', fontSize: '16px' }}>
                ✨ Choose Your Class
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${classOptions.length}, 1fr)`, gap: '12px', marginBottom: '25px' }}>
                {classOptions.map((cls) => (
                    <div key={cls.id}
                        onClick={() => setSelectedClass(cls.id)}
                        style={{
                            background: selectedClass === cls.id ? `linear-gradient(135deg, ${cls.color}22, ${cls.color}11)` : 'rgba(255,255,255,0.02)',
                            border: selectedClass === cls.id ? `2px solid ${cls.color}` : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px', padding: '18px', cursor: 'pointer',
                            transition: 'all 0.35s ease', position: 'relative', overflow: 'hidden',
                            transform: selectedClass === cls.id ? 'scale(1.03)' : 'scale(1)',
                            boxShadow: selectedClass === cls.id ? `0 8px 25px ${cls.color}33` : 'none'
                        }}>
                        {/* Popular badge */}
                        {cls.id === 'business' || cls.id === 'ac3' || cls.id === 'semi' ? (
                            <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>POPULAR</div>
                        ) : null}
                        
                        <div style={{ fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>{cls.img}</div>
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '13px', marginRight: '5px' }}>{cls.icon}</span>
                            <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>{cls.label}</strong>
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '22px', fontWeight: '800', color: cls.color }}>
                                {cls.price === 0 ? 'Included' : `+₹${cls.price.toLocaleString()}`}
                            </span>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {cls.amenities.map((a, i) => (
                                <li key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: cls.color, fontSize: '10px' }}>✓</span> {a}
                                </li>
                            ))}
                        </ul>
                        {selectedClass === cls.id && (
                            <div style={{ textAlign: 'center', marginTop: '12px', color: cls.color, fontWeight: '700', fontSize: '13px' }}>
                                ✅ Selected
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Interactive Seat Map */}
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '16px' }}>
                🗺️ Pick Your Seat
            </h4>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '15px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span><span style={{ display: 'inline-block', width: '14px', height: '14px', background: '#10b981', borderRadius: '3px', verticalAlign: 'middle', marginRight: '5px' }}></span> Available</span>
                    <span><span style={{ display: 'inline-block', width: '14px', height: '14px', background: '#ef4444', borderRadius: '3px', verticalAlign: 'middle', marginRight: '5px' }}></span> Taken</span>
                    <span><span style={{ display: 'inline-block', width: '14px', height: '14px', background: '#6366f1', borderRadius: '3px', verticalAlign: 'middle', marginRight: '5px' }}></span> Your Seat</span>
                </div>
                {/* Seat grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    {seatMap.map((row, ri) => (
                        <div key={ri} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {row.map((seat) => {
                                if (seat.type === 'aisle') return <div key={seat.id} style={{ width: '20px' }}></div>;
                                const isSelected = selectedSeat === seat.id;
                                return (
                                    <div key={seat.id}
                                        onClick={() => !seat.taken && setSelectedSeat(seat.id)}
                                        title={seat.taken ? 'Taken' : seat.label}
                                        style={{
                                            width: '34px', height: '34px', borderRadius: '6px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', fontWeight: '700', cursor: seat.taken ? 'not-allowed' : 'pointer',
                                            background: seat.taken ? '#ef4444' : isSelected ? '#6366f1' : '#10b981',
                                            color: '#fff', transition: 'all 0.2s',
                                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                            boxShadow: isSelected ? '0 0 12px rgba(99,102,241,0.6)' : 'none',
                                            opacity: seat.taken ? 0.5 : 1
                                        }}>
                                        {seat.label}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                {selectedSeat && (
                    <div style={{ textAlign: 'center', marginTop: '12px', color: '#6366f1', fontWeight: '700', fontSize: '14px' }}>
                        🎯 Seat {seatMap.flat().find(s => s.id === selectedSeat)?.label || selectedSeat} selected!
                    </div>
                )}
            </div>

            {/* Confirm Button */}
            <button onClick={handleConfirm}
                disabled={!selectedClass}
                style={{
                    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                    background: selectedClass ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    color: selectedClass ? '#000' : 'var(--text-muted)',
                    fontWeight: '700', fontSize: '15px', cursor: selectedClass ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s'
                }}>
                {selectedClass ? `Confirm ${classOptions.find(c => c.id === selectedClass)?.label} Class${selectedSeat ? ` — Seat ${seatMap.flat().find(s => s.id === selectedSeat)?.label}` : ''}` : 'Select a class to continue'}
            </button>
        </div>
    );
};

export default SeatSelector;
