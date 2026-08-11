import React from 'react';
import { useNavigate } from 'react-router-dom';

const CancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', maxWidth: '600px', margin: '50px auto' }}>
      <h1 style={{ fontSize: '32px', color: 'var(--danger)', marginBottom: '20px' }}>❌ Payment Cancelled</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Your payment was not completed. You can try again anytime.</p>
      <button onClick={() => navigate('/cart')} className="btn btn-accent">Return to Cart</button>
    </div>
  );
};

export default CancelPage;
