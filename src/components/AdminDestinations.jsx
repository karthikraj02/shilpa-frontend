import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AdminDestinations = () => {
    const [destinations, setDestinations] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', location: '', category: 'beach', description: '', price: '', imageUrl: '' });
    const [editId, setEditId] = useState(null);

    const token = localStorage.getItem('token');
    const ax = axios.create({ headers: { Authorization: `Bearer ${token}` } });

    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        const res = await axios.get('/api/destinations');
        setDestinations(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await ax.put(`/api/destinations/${editId}`, formData);
            } else {
                await ax.post('/api/destinations', formData);
            }
            setShowModal(false);
            fetchDestinations();
        } catch (err) {
            alert('Error saving destination');
        }
    };

    const handleEdit = (dest) => {
        setFormData(dest);
        setEditId(dest._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            await ax.delete(`/api/destinations/${id}`);
            fetchDestinations();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Manage Destinations</h2>
                <button className="btn btn-accent" onClick={() => { setFormData({ name: '', location: '', category: 'beach', description: '', price: '', imageUrl: '' }); setEditId(null); setShowModal(true); }}>
                    <Plus size={18} /> Add Destination
                </button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {destinations.map(dest => (
                        <tr key={dest._id}>
                            <td>{dest.name}</td>
                            <td>{dest.location}</td>
                            <td style={{ textTransform: 'capitalize' }}>{dest.category}</td>
                            <td>₹{dest.price.toLocaleString()}</td>
                            <td>
                                <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: 'var(--text-main)' }} onClick={() => handleEdit(dest)}>
                                    <Edit2 size={16} />
                                </button>
                                <button className="btn" style={{ padding: '5px 10px', background: 'transparent', color: 'var(--danger)' }} onClick={() => handleDelete(dest._id)}>
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div className="modal-header">
                            <h3>{editId ? 'Edit' : 'Add'} Destination</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="beach">Beach</option>
                                    <option value="mountain">Mountain</option>
                                    <option value="historical">Historical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea required rows="3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Image URL</label>
                                <input required type="url" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-accent" style={{ flex: 1 }}>Save Destination</button>
                                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDestinations;
