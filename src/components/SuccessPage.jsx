import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';

const SuccessPage = ({ setCart }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const pendingBookingsStr = localStorage.getItem('pendingBookings');
    
    // If no session or pending bookings, someone just navigated here directly
    if (!sessionId && !pendingBookingsStr) {
      setStatus('success'); // Just show success if they revisit
      return;
    }

    const createBookings = async () => {
      try {
        if (pendingBookingsStr) {
          const bookings = JSON.parse(pendingBookingsStr);
          const token = localStorage.getItem('token');
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          
          // Execute all booking creations
          for (const payload of bookings) {
            // Overwrite the transaction ID with real session ID if available
            if (sessionId) {
              payload.payment.transactionId = sessionId;
            }
            await axios.post('/api/bookings', payload, config);
          }
          
          localStorage.removeItem('pendingBookings');
          if (setCart) setCart([]);
        }
        setStatus('success');
      } catch (err) {
        console.error("Booking creation failed:", err);
        setStatus('error');
      }
    };
    
    if (pendingBookingsStr) {
        createBookings();
    } else {
        setStatus('success');
    }
  }, [searchParams, setCart]);

  return (
    <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', maxWidth: '600px', margin: '50px auto' }}>
      {status === 'processing' && <h2>Processing your booking...</h2>}
      
      {status === 'success' && (
        <>
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.1)', padding: '25px', borderRadius: '50%', color: '#10b981', marginBottom: '25px' }}>
            <CheckCircle size={70} />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '15px' }}>✅ Payment Successful</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your payment was processed successfully and your booking is confirmed!</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-accent">Go to Dashboard</button>
            <button onClick={() => navigate('/')} className="btn" style={{ background: 'transparent', border: '1px solid var(--border)' }}>Plan Another Trip</button>
          </div>
        </>
      )}
      
      {status === 'error' && (
        <>
          <h2 style={{ color: 'var(--danger)' }}>Payment verified, but booking failed to save.</h2>
          <p style={{ color: 'var(--text-muted)' }}>Please contact support.</p>
        </>
      )}
    </div>
  );
};

export default SuccessPage;
