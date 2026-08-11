import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AdminTripPlans = () => {
    const [trips, setTrips] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ type: 'Family Trip', destination: '', duration: '1 Day Trip', price: '' });
    const [editId, setEditId] = useState(null);

    const token = localStorage.getItem('token');
    const ax = axios.create({ headers: { Authorization: `Bearer ${token}` } });

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        const res = await axios.get('/api/tripplans');
        setTrips(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await ax.put(`/api/tripplans/${editId}`, formData);
            } else {
                await ax.post('/api/tripplans', formData);
            }
            setShowModal(false);
            fetchTrips();
        } catch (err) {
            alert('Error saving trip plan');
        }
    };

    const handleEdit = (trip) => {
        setFormData(trip);
        setEditId(trip._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this trip plan?')) {
            await ax.delete(`/api/tripplans/${id}`);
            fetchTrips();
        }
    };

    const groupedTrips = trips.reduce((acc, trip) => {
        if (!acc[trip.type]) acc[trip.type] = [];
        acc[trip.type].push(trip);
        return acc;
    }, {});

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Manage Trip Plans (Packages)</h2>
                <button className="btn btn-accent" onClick={() => { setFormData({ type: 'Family Trip', destination: '', duration: '1 Day Trip', price: '' }); setEditId(null); setShowModal(true); }}>
                    <Plus size={18} /> Add Trip Plan
                </button>
            </div>

            {Object.keys(groupedTrips).length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No trip plans found. Add some!</p>
            ) : (
                Object.keys(groupedTrips).map(type => (
                    <div key={type} style={{ marginBottom: '40px' }}>
                        <h3 style={{ borderBottom: '2px solid var(--accent)', paddingBottom: '10px', marginBottom: '15px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '1px' }}>{type} Packages</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Destination</th>
                                    <th>Duration</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedTrips[type].map(trip => (
                                    <tr key={trip._id}>
                                        <td>{trip.destination}</td>
                                        <td>{trip.duration}</td>
                                        <td>₹{trip.price.toLocaleString()}</td>
                                        <td>
                                            <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: 'var(--text-main)' }} onClick={() => handleEdit(trip)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: 'var(--danger)' }} onClick={() => handleDelete(trip._id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div className="modal-header">
                            <h3>{editId ? 'Edit' : 'Add'} Trip Plan</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Trip Type</label>
                                <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="Family Trip">Family Trip</option>
                                    <option value="Friends Trip">Friends Trip</option>
                                    <option value="Vacation Trip">Vacation Trip</option>
                                    <option value="Couple Trip">Couple Trip</option>
                                    <option value="Solo Trip">Solo Trip</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Destination</label>
                                <input required type="text" placeholder="e.g. Maldives" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <select required value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}>
                                    <option value="1 Day Trip">1 Day Trip</option>
                                    <option value="2 Day Trip">2 Day Trip</option>
                                    <option value="3 Day Trip">3 Day Trip</option>
                                    <option value="4 Day Trip">4 Day Trip</option>
                                    <option value="1 Week Trip">1 Week Trip</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <input required type="number" placeholder="1500" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-accent" style={{ flex: 1 }}>Save Trip Plan</button>
                                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTripPlans;
