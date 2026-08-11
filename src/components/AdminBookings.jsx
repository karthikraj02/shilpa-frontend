import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Check, X } from 'lucide-react';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);

    const token = localStorage.getItem('token');
    const ax = axios.create({ headers: { Authorization: `Bearer ${token}` } });

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await ax.get('/api/admin/bookings');
            setBookings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await ax.patch(`/api/admin/bookings/${id}/status`, { status });
            fetchBookings();
        } catch (err) {
            alert('Error updating status');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this booking?')) {
            await ax.delete(`/api/admin/bookings/${id}`);
            fetchBookings();
        }
    };

    return (
        <div>
            <h2 style={{ marginBottom: '20px' }}>Manage Bookings</h2>
            <table>
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Destination</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(book => (
                        <React.Fragment key={book._id}>
                            <tr style={{ borderBottom: 'none' }}>
                                <td>{book.name}</td>
                                <td>{book.email}</td>
                                <td>{book.destination?.name || 'Unknown'}</td>
                                <td>{new Date(book.travelDate).toLocaleDateString()}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                                        background: book.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.2)' : book.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                        color: book.status === 'Confirmed' ? '#10b981' : book.status === 'Cancelled' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {book.status}
                                    </span>
                                </td>
                                <td>
                                    {book.status === 'Pending' && (
                                        <>
                                            <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: '#10b981' }} onClick={() => updateStatus(book._id, 'Confirmed')} title="Approve">
                                                <Check size={16} />
                                            </button>
                                            <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: '#f59e0b' }} onClick={() => updateStatus(book._id, 'Cancelled')} title="Reject">
                                                <X size={16} />
                                            </button>
                                        </>
                                    )}
                                    <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: 'var(--danger)' }} onClick={() => handleDelete(book._id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <td colSpan="6" style={{ padding: '10px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                                        <div><strong>Transport:</strong> {book.transport?.name || (typeof book.transport === 'string' ? book.transport : 'Not selected')}</div>
                                        <div><strong>Stay:</strong> {book.stay?.name || 'Not selected'}</div>
                                        <div><strong>Food:</strong> {book.food ? `${book.food.preference} (${book.food.mealPlan})` : 'Not selected'}</div>
                                        <div><strong>Payment:</strong> {book.payment ? `${book.payment.method} (₹${book.payment.amount})` : 'Pending'}</div>
                                        <div><strong>Total Cost:</strong> ₹{book.totalCost || 'N/A'}</div>
                                        {book.review && (
                                            <div style={{ width: '100%', marginTop: '5px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                                <strong>Review ({book.review.rating}/5):</strong> "{book.review.comment}"
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminBookings;
