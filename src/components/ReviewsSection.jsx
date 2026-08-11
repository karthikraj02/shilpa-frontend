import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, MessageSquare, Shield, Clock, ThumbsUp, ChevronDown, UserCircle2 } from 'lucide-react';

const ReviewsSection = ({ entityId, entityType, onReviewSubmitted }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    const [filter, setFilter] = useState('latest'); // 'latest' or 'highest'
    
    // Form state
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [guestName, setGuestName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    const tokenStr = localStorage.getItem('token');
    const token = tokenStr && tokenStr !== 'null' ? tokenStr : null;
    const isLoggedIn = !!token;
    const usernameStr = localStorage.getItem('username');
    const currentUsername = usernameStr && usernameStr !== 'null' ? usernameStr : null;

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`/api/reviews/${encodeURIComponent(entityId)}?sort=${filter}`);
            setReviews(res.data.reviews || []);
            setStats(res.data.stats || { totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
        } catch (err) {
            console.error('Failed to fetch reviews', err);
        }
    };

    useEffect(() => {
        if (entityId) {
            fetchReviews();
        }
    }, [entityId, filter]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reviewText.trim()) return;

        setIsSubmitting(true);
        setMsg(null);

        try {
            const payload = {
                rating,
                reviewText,
                username: isLoggedIn ? currentUsername : (guestName.trim() || 'Anonymous Guest')
            };

            if (entityType === 'destination') payload.destinationId = entityId;
            else if (entityType === 'hotel') payload.hotelId = entityId;
            else if (entityType === 'transport') payload.transportId = entityId;

            const config = isLoggedIn ? { headers: { Authorization: `Bearer ${token}` } } : {};
            await axios.post('/api/reviews', payload, config);

            setReviewText('');
            setGuestName('');
            setRating(5);
            setMsg({ type: 'success', text: 'Thank you! Your review has been saved successfully.' });
            fetchReviews();
            
            if (onReviewSubmitted) {
                onReviewSubmitted({ rating: payload.rating, reviewText: payload.reviewText });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to submit review. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render stars helper
    const renderStars = (count) => {
        return (
            <div style={{ display: 'flex', gap: '2px', color: '#fbbf24' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ fontSize: '16px' }}>
                        {star <= count ? '⭐' : '☆'}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="glass-panel" style={{ padding: '30px', borderRadius: '16px', background: 'rgba(20, 20, 35, 0.65)', border: '1px solid rgba(255,255,255,0.06)', marginTop: '30px' }}>
            
            {/* Header & Stats summary */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '22px', margin: '0 0 5px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={22} color="var(--accent)" /> Reviews & Ratings
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                    Hear what other travelers are saying or share your own experience!
                </p>
            </div>

            {/* Statistics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', marginBottom: '40px', background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Average Score */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '15px' }}>
                    <h1 style={{ fontSize: '64px', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 5px 0', lineHeight: 1 }}>
                        {stats.averageRating || '0.0'}
                    </h1>
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>
                        {renderStars(Math.round(stats.averageRating))}
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                    </span>
                </div>

                {/* Rating Distribution Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = stats.distribution[stars] || 0;
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                            <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                <span style={{ width: '50px', color: 'var(--text-muted)', textAlign: 'right' }}>{stars} Star</span>
                                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${percentage}%`, height: '100%', background: '#fbbf24', borderRadius: '4px', transition: 'width 0.6s ease' }} />
                                </div>
                                <span style={{ width: '40px', color: 'var(--text-muted)' }}>{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Submission Form */}
            <div className="glass-panel" style={{ padding: '25px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '35px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: 'var(--text-main)' }}>✍️ Write a Review</h4>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {/* Star selection */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Your Rating:</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = star <= (hoverRating || rating);
                                return (
                                    <Star 
                                        key={star}
                                        size={28}
                                        fill={isFilled ? '#fbbf24' : 'none'}
                                        color={isFilled ? '#fbbf24' : '#6b7280'}
                                        style={{ cursor: 'pointer', transition: 'transform 0.2s ease, fill 0.2s ease', transform: hoverRating === star ? 'scale(1.25)' : 'none' }}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    />
                                );
                            })}
                        </div>
                        <span style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 'bold' }}>
                            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Good!' : rating === 3 ? 'Average' : rating === 2 ? 'Disappointing' : 'Terrible'}
                        </span>
                    </div>

                    {/* Guest Name (only shown if not logged in) */}
                    {!isLoggedIn && (
                        <div>
                            <input 
                                type="text"
                                placeholder="Your Name (Optional)"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                            />
                        </div>
                    )}

                    {/* Review text */}
                    <div>
                        <textarea 
                            rows={3}
                            placeholder="Share the details of your travel experience..."
                            required
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', resize: 'vertical' }}
                        />
                    </div>

                    {/* Feedback messages */}
                    {msg && (
                        <div style={{
                            padding: '10px 15px', borderRadius: '8px', fontSize: '14px',
                            background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: msg.type === 'success' ? '#10b981' : '#ef4444',
                            border: msg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            {msg.text}
                        </div>
                    )}

                    <div>
                        <button type="submit" disabled={isSubmitting} className="btn btn-accent" style={{ padding: '10px 24px', fontWeight: 'bold', width: 'auto' }}>
                            {isSubmitting ? 'Posting...' : 'Post Review'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List & Filtering */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>💬 User Feedbacks ({reviews.length})</h4>
                    
                    {/* Filter drop down */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sort by:</span>
                        <select 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)',
                                padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
                            }}
                        >
                            <option value="latest" style={{ background: '#111827', color: '#ffffff' }}>Latest Reviews</option>
                            <option value="highest" style={{ background: '#111827', color: '#ffffff' }}>Highest Ratings</option>
                        </select>
                    </div>
                </div>

                {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>No reviews yet.</p>
                        <p style={{ margin: 0, fontSize: '14px' }}>Be the first to review this {entityType}!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {reviews.map((rev) => (
                            <div key={rev._id} className="review-card" style={{
                                padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '12px',
                                transition: 'all 0.3s ease'
                            }}>
                                {/* User header card */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <UserCircle2 size={24} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {rev.username}
                                                {rev.user && <span style={{ fontSize: '10px', background: 'rgba(129, 140, 248, 0.2)', color: 'var(--accent)', padding: '2px 6px', borderRadius: '10px' }}>Verified</span>}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {renderStars(rev.rating)}
                                    </div>
                                </div>

                                {/* Review message */}
                                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {rev.reviewText}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsSection;
