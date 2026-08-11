import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewsSection from './ReviewsSection';

const SubmitReviewPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                // We need to fetch without auth because the link might be clicked directly from email 
                // Wait, if it requires auth, the user will be redirected to login. Let's assume auth is handled or we use a public endpoint.
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/bookings/${bookingId}`, {
                    headers: token ? {
                        'x-auth-token': token
                    } : {}
                });
                const data = await response.json();
                
                if (response.ok) {
                    setBooking(data);
                } else {
                    setError(data.msg || 'Failed to fetch booking details');
                }
            } catch (err) {
                console.error('Error fetching booking:', err);
                setError('Network error or server unavailable');
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a', color: 'white' }}>
                <span style={{ marginLeft: '1rem' }}>Loading booking details...</span>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a', color: 'white' }}>
                <div style={{ backgroundColor: 'rgba(127, 29, 29, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #ef4444', textAlign: 'center', maxWidth: '28rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Error</h2>
                    <p>{error || 'Booking not found'}</p>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // Determine the destination ID to pass to ReviewsSection
    const destinationId = booking.destination?._id || booking.destination;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'black', color: 'white', padding: '2rem' }}>
            <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}
                    >
                        <span style={{ marginRight: '0.5rem' }}>&larr;</span> Back to Home
                    </button>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', background: 'linear-gradient(to right, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Rate Your Trip
                    </h1>
                    <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
                        We hope you enjoyed your trip to <strong>{booking.destination?.name || 'your destination'}</strong>! 
                        Your feedback helps us and other travelers.
                    </p>
                </div>

                <div style={{ backgroundColor: '#111827', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #1f2937', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                    <ReviewsSection entityId={destinationId} />
                </div>
            </div>
        </div>
    );
};

export default SubmitReviewPage;
