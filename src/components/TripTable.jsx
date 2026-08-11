import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Star, MapPin, Clock, Search, X, Check, Filter, Heart, BarChart2, Calendar, Sun, CloudRain, Users, Eye, TrendingUp, Info, Activity, Camera, Map } from 'lucide-react';

const SKELETON_ARRAY = Array(6).fill(0);

const SkeletonCard = () => (
    <div className="skeleton-card" style={{ background: '#121212', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', height: '450px' }}>
        <div style={{ height: '220px', background: 'linear-gradient(90deg, #1f1f1f 25%, #2a2a2a 50%, #1f1f1f 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ height: '20px', width: '50%', background: '#1f1f1f', borderRadius: '4px' }} />
            <div style={{ height: '24px', width: '80%', background: '#1f1f1f', borderRadius: '4px' }} />
            <div style={{ height: '16px', width: '100%', background: '#1f1f1f', borderRadius: '4px' }} />
            <div style={{ height: '16px', width: '90%', background: '#1f1f1f', borderRadius: '4px' }} />
            <div style={{ height: '30px', width: '40%', background: '#1f1f1f', borderRadius: '4px', marginTop: 'auto' }} />
            <div style={{ height: '40px', width: '100%', background: '#1f1f1f', borderRadius: '8px' }} />
        </div>
    </div>
);

const TripTable = ({ addToCart, onTripAdded }) => {
    // ── DATA STATE ──
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wishlist, setWishlist] = useState(new Set());
    const [recentlyViewed, setRecentlyViewed] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem('token'));
    
    // ── FILTER STATE ──
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [budgetFilter, setBudgetFilter] = useState('All');
    const [durationFilter, setDurationFilter] = useState('All');
    const [sortType, setSortType] = useState('Popularity');
    
    // ── UI STATE ──
    const [selectedTrip, setSelectedTrip] = useState(null); // View Details modal
    const [bookingTrip, setBookingTrip] = useState(null); // Book Now modal
    const [compareList, setCompareList] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [toastMessage, setToastMessage] = useState(''); // Toast notification
    
    // Booking Form State
    const [bookingForm, setBookingForm] = useState({ travelDate: '', adults: 2, children: 0 });

    const token = localStorage.getItem('token');
    
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
            .hide-scroll::-webkit-scrollbar { display: none; }
            .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            .trip-card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.5); border-color: rgba(37,99,235,0.4); }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Trips
                const res = await axios.get('/api/tripplans');
                setTrips(res.data);
                
                // Fetch Wishlist
                if (token) {
                    const wishRes = await axios.get('/api/auth/wishlist', { headers: { Authorization: `Bearer ${token}` } });
                    setWishlist(new Set(wishRes.data.map(t => t._id || t)));
                }

                // Load Recently Viewed from local storage
                const localRecent = JSON.parse(localStorage.getItem('recentTrips') || '[]');
                setRecentlyViewed(localRecent);

                // Fetch AI Recommendations if authed
                if (token) {
                    const aiRes = await axios.post('/api/tripplans/recommendations', {
                        history: localRecent,
                        wishlist: Array.from(wishlist)
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    setRecommendations(aiRes.data);
                } else {
                    // Fallback to top popular for guests
                    const pop = [...res.data].sort((a,b) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 4);
                    setRecommendations(pop);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [token]);

    const handleWishlistToggle = async (e, tripId) => {
        e.stopPropagation();
        if (!token) return alert('Please login to save to wishlist.');
        try {
            const res = await axios.post(`/api/auth/wishlist/${tripId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setWishlist(new Set(res.data.map(id => id.toString())));
        } catch (err) {
            console.error('Wishlist error', err);
        }
    };

    const handleViewDetails = async (trip) => {
        setSelectedTrip(trip);
        // Track View
        try {
            await axios.post(`/api/tripplans/${trip._id}/view`);
        } catch (e) {}
        
        // Update Recently Viewed
        let recent = [...recentlyViewed];
        recent = recent.filter(id => id !== trip._id);
        recent.unshift(trip._id);
        if (recent.length > 10) recent = recent.slice(0, 10);
        setRecentlyViewed(recent);
        localStorage.setItem('recentTrips', JSON.stringify(recent));
    };

    const handleBookNowSubmit = (e) => {
        e.preventDefault();
        const cartItem = {
            _id: bookingTrip._id,
            destination: bookingTrip.destination,
            type: bookingTrip.category + ' Package',
            duration: bookingTrip.duration,
            price: bookingTrip.price * (parseInt(bookingForm.adults) + (parseInt(bookingForm.children) * 0.5)),
            image: bookingTrip.heroImage || bookingTrip.image,
            details: `Travel Date: ${bookingForm.travelDate} | Adults: ${bookingForm.adults} | Kids: ${bookingForm.children}`
        };
        addToCart(cartItem);
        setToastMessage(`Success! ${bookingTrip.destination} has been added to your cart.`);
        setTimeout(() => setToastMessage(''), 3500);
        setBookingTrip(null);
        setSelectedTrip(null);
        if (onTripAdded) onTripAdded(cartItem);
    };

    const toggleCompare = (e, trip) => {
        e.stopPropagation();
        if (compareList.find(t => t._id === trip._id)) {
            setCompareList(compareList.filter(t => t._id !== trip._id));
        } else {
            if (compareList.length >= 3) return alert('You can compare up to 3 packages at once.');
            setCompareList([...compareList, trip]);
        }
    };

    // ── FILTERING LOGIC ──
    const filteredTrips = useMemo(() => {
        let result = trips.filter(trip => {
            let searchStr = searchQuery.toLowerCase().trim();
            // Typo tolerance based on common mistakes
            if (searchStr === 'udpi') searchStr = 'udupi';
            if (searchStr === 'mys') searchStr = 'mysore';
            if (searchStr === 'cof') searchStr = 'coffee';
            if (searchStr === 'go') searchStr = 'goa';
            
            const matchesSearch = trip.destination?.toLowerCase().includes(searchStr) || 
                                  trip.state?.toLowerCase().includes(searchStr) ||
                                  trip.category?.toLowerCase().includes(searchStr) ||
                                  (trip.tags || []).some(t => t.toLowerCase().includes(searchStr));
            
            const matchesCat = categoryFilter === 'All' || trip.category === categoryFilter || (trip.tags || []).includes(categoryFilter);
            
            let matchesBudget = true;
            if (budgetFilter === 'Under ₹10k') matchesBudget = trip.price < 10000;
            if (budgetFilter === '₹10k - ₹20k') matchesBudget = trip.price >= 10000 && trip.price <= 20000;
            if (budgetFilter === '₹20k - ₹50k') matchesBudget = trip.price > 20000 && trip.price <= 50000;
            if (budgetFilter === '₹50k+') matchesBudget = trip.price > 50000;

            let matchesDuration = true;
            let maxDays = 0;
            if (trip.duration) {
                const matches = trip.duration.match(/\d+/g);
                if (matches) maxDays = Math.max(...matches.map(Number));
            }
            if (durationFilter === 'Weekend') matchesDuration = maxDays > 0 && maxDays <= 3;
            if (durationFilter === '1 Week') matchesDuration = maxDays >= 4 && maxDays <= 7;
            if (durationFilter === '10+ Days') matchesDuration = maxDays >= 8;

            return matchesSearch && matchesCat && matchesBudget && matchesDuration;
        });

        if (sortType === 'Price: Low to High') result.sort((a, b) => a.price - b.price);
        if (sortType === 'Price: High to Low') result.sort((a, b) => b.price - a.price);
        if (sortType === 'Highest Rated') result.sort((a, b) => b.rating - a.rating);
        if (sortType === 'Popularity') result.sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

        return result;
    }, [trips, searchQuery, categoryFilter, budgetFilter, durationFilter, sortType]);

    const categories = ['All', 'Beach', 'Mountain', 'Heritage', 'Wildlife', 'Adventure', 'Family', 'Couple'];
    const budgets = ['All', 'Under ₹10k', '₹10k - ₹20k', '₹20k - ₹50k', '₹50k+'];
    const durations = ['All', 'Weekend', '1 Week', '10+ Days'];
    const popularSearches = ['Goa', 'Coorg', 'Manali', 'Udupi', 'Kerala', 'Leh'];

    // Sub-components
    const PackageCard = ({ trip }) => {
        const isWishlisted = wishlist.has(trip._id);
        const isComparing = compareList.find(t => t._id === trip._id);
        
        return (
            <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="trip-card-hover"
                onClick={() => handleViewDetails(trip)}
                style={{
                    background: '#121212', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                <div style={{ position: 'relative', height: '240px' }}>
                    <img 
                        src={trip.heroImage || trip.image} 
                        alt={trip.destination} 
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    
                    {/* Tags */}
                    {(trip.tags || []).includes('Best Seller') && (
                        <div style={{ position: 'absolute', top: 12, left: 12, background: '#f59e0b', color: '#000', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                            🔥 Best Seller
                        </div>
                    )}
                    
                    {/* Wishlist Button */}
                    <button 
                        onClick={(e) => handleWishlistToggle(e, trip._id)}
                        style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                    >
                        <Heart size={18} fill={isWishlisted ? '#ef4444' : 'transparent'} color={isWishlisted ? '#ef4444' : 'white'} />
                    </button>
                    
                    {/* Compare Checkbox */}
                    <button 
                        onClick={(e) => toggleCompare(e, trip)}
                        style={{ position: 'absolute', bottom: 12, left: 12, background: isComparing ? '#2563eb' : 'rgba(0,0,0,0.6)', border: isComparing ? 'none' : '1px solid rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'white', fontSize: '11px', backdropFilter: 'blur(4px)' }}
                    >
                        {isComparing ? <Check size={12}/> : <BarChart2 size={12}/>} 
                        {isComparing ? 'Comparing' : 'Compare'}
                    </button>

                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'white', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}>
                        <Star size={12} color="#fbbf24" fill="#fbbf24" /> {trip.rating} ({trip.reviewCount || 42})
                    </div>
                </div>

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                            <div style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                {trip.category} PACKAGE
                            </div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {trip.destination} 
                            </h3>
                            <div style={{ color: '#9ca3af', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <MapPin size={12} /> {trip.state}
                            </div>
                        </div>
                    </div>
                    
                    <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.5', margin: '10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {trip.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                        {(trip.attractions || []).slice(0, 3).map((attr, idx) => (
                            <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                                {attr}
                            </span>
                        ))}
                    </div>

                    <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ color: '#9ca3af', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <Clock size={12} /> {trip.duration}
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>
                                ₹{trip.price.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#9ca3af' }}>/ person</span>
                            </div>
                        </div>
                        <button 
                            style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                            onClick={(e) => { e.stopPropagation(); handleViewDetails(trip); }}
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f5f9' }}>
            
            {/* ── TOAST NOTIFICATION ── */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10000, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                    >
                        <Check size={18} /> {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HERO BANNER & SEARCH ── */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)', padding: '60px 20px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Find Your Next Adventure</h1>
                <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 30px' }}>Discover breathtaking destinations, curated experiences, and exclusive deals tailored just for you.</p>
                
                <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={24} />
                    <input 
                        type="text" 
                        placeholder="Search destinations, states, themes (e.g., Goa, Beach, Kerala)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '18px 20px 18px 56px', borderRadius: '30px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '16px', outline: 'none', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                    />
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginTop: '25px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px', alignSelf: 'center' }}>Popular:</span>
                    {popularSearches.map(term => (
                        <button key={term} onClick={() => setSearchQuery(term)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', transition: 'background 0.2s' }}>
                            {term}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px 20px', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* ── SIDEBAR FILTERS ── */}
                <div style={{ width: '280px', flexShrink: 0, background: '#121212', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px', fontWeight: 'bold', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                        <Filter size={20} color="#3b82f6" /> Filters
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '14px', textAlign: 'left' }}>Category</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                            {categories.map(cat => (
                                <label key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                                    <input type="radio" checked={categoryFilter === cat} onChange={() => setCategoryFilter(cat)} style={{ accentColor: '#3b82f6', margin: 0 }} />
                                    {cat}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '14px', textAlign: 'left' }}>Budget</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                            {budgets.map(b => (
                                <label key={b} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                                    <input type="radio" checked={budgetFilter === b} onChange={() => setBudgetFilter(b)} style={{ accentColor: '#3b82f6', margin: 0 }} />
                                    {b}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '14px', textAlign: 'left' }}>Duration</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                            {durations.map(d => (
                                <label key={d} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', color: '#94a3b8', fontSize: '14px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                                    <input type="radio" checked={durationFilter === d} onChange={() => setDurationFilter(d)} style={{ accentColor: '#3b82f6', margin: 0 }} />
                                    {d}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    
                    {!searchQuery && (
                        <>
                            {/* Offers Carousel */}
                            <div className="hide-scroll" style={{ display: 'flex', gap: '15px', overflowX: 'auto', marginBottom: '40px', paddingBottom: '10px' }}>
                                {[
                                    { title: 'Summer Sale ☀️', desc: 'Flat 15% OFF on Beach Packages', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
                                    { title: 'Family Special 👨‍👩‍👧', desc: 'Kids stay free on selected tours', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
                                    { title: 'Early Bird 🐦', desc: 'Book 30 days ahead for 10% OFF', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }
                                ].map((offer, i) => (
                                    <div key={i} style={{ background: offer.color, minWidth: '300px', padding: '20px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                                        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{offer.title}</h3>
                                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{offer.desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendations Row (Only if authed) */}
                            {isAuthed && recommendations.length > 0 && (
                                <div style={{ marginBottom: '40px' }}>
                                    <h2 style={{ fontSize: '24px', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        ✨ Recommended For You <span style={{ fontSize: '12px', background: 'rgba(59,130,246,0.2)', color: '#3b82f6', padding: '2px 8px', borderRadius: '10px' }}>AI Powered</span>
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                        {recommendations.slice(0, 4).map(trip => <PackageCard key={'rec-'+trip._id} trip={trip} />)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Main Grid Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h2 style={{ fontSize: '24px', margin: 0 }}>All Packages <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>({filteredTrips.length} results)</span></h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Sort By:</span>
                            <select 
                                value={sortType} 
                                onChange={(e) => setSortType(e.target.value)}
                                style={{ background: '#121212', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', outline: 'none' }}
                            >
                                <option>Popularity</option>
                                <option>Highest Rated</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Main Grid */}
                    {loading ? (
                        <div>
                            <div style={{ marginBottom: '15px', color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="typing-indicator" style={{ display: 'inline-flex' }}><span></span><span></span><span></span></span> Loading destination images...
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                {SKELETON_ARRAY.map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 20px', background: '#121212', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <Search size={48} color="#475569" style={{ marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>No packages found</h3>
                            <p style={{ color: '#94a3b8' }}>Try adjusting your filters or search query.</p>
                            <button onClick={() => { setSearchQuery(''); setCategoryFilter('All'); setBudgetFilter('All'); setDurationFilter('All'); }} style={{ marginTop: '20px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.5)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Clear All Filters</button>
                        </div>
                    ) : (
                        <motion.div layout className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            <AnimatePresence>
                                {filteredTrips.map(trip => <PackageCard key={trip._id} trip={trip} />)}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* ── FLOATING COMPARE BAR ── */}
            <AnimatePresence>
                {compareList.length > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', padding: '15px 25px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 900 }}
                    >
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{compareList.length} Selected to Compare</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {compareList.map(t => (
                                <div key={t._id} onClick={(e) => toggleCompare(e, t)} style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', cursor: 'pointer', position: 'relative' }}>
                                    <img src={t.heroImage || t.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                        <X size={16} color="white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => setShowCompareModal(true)}
                            disabled={compareList.length < 2}
                            style={{ background: compareList.length > 1 ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: compareList.length > 1 ? 'white' : '#94a3b8', border: 'none', padding: '10px 20px', borderRadius: '25px', fontWeight: 'bold', cursor: compareList.length > 1 ? 'pointer' : 'not-allowed' }}
                        >
                            Compare Now
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── COMPARE MODAL ── */}
            <AnimatePresence>
                {showCompareModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
                    >
                        <div style={{ background: '#121212', width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', position: 'relative' }}>
                            <button onClick={() => setShowCompareModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            <h2 style={{ margin: '0 0 30px 0', fontSize: '28px' }}>Compare Packages</h2>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareList.length}, 1fr)`, gap: '20px' }}>
                                {compareList.map(trip => (
                                    <div key={trip._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
                                        <img src={trip.heroImage || trip.image} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
                                        <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>{trip.destination}</h3>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#cbd5e1', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                                <span style={{ color: '#94a3b8' }}>Price</span>
                                                <strong style={{ color: '#3b82f6', fontSize: '16px' }}>₹{trip.price}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                                <span style={{ color: '#94a3b8' }}>Duration</span>
                                                <span>{trip.duration}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                                <span style={{ color: '#94a3b8' }}>Rating</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} color="#fbbf24" fill="#fbbf24"/> {trip.rating}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                                <span style={{ color: '#94a3b8' }}>Transport</span>
                                                <span>{trip.transport || 'Not Included'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                                <span style={{ color: '#94a3b8' }}>Hotel</span>
                                                <span>{trip.hotel || 'Not Included'}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => { setShowCompareModal(false); setBookingTrip(trip); }} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Book This
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── VIEW DETAILS FULL-SCREEN OVERLAY ── */}
            <AnimatePresence>
                {selectedTrip && !bookingTrip && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 2000, overflowY: 'auto' }}
                    >
                        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => setSelectedTrip(null)} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '30px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <X size={18} /> Close
                            </button>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={(e) => handleWishlistToggle(e, selectedTrip._id)} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%', color: 'white', cursor: 'pointer' }}>
                                    <Heart size={20} fill={wishlist.has(selectedTrip._id) ? '#ef4444' : 'transparent'} color={wishlist.has(selectedTrip._id) ? '#ef4444' : 'white'} />
                                </button>
                                <button onClick={() => setBookingTrip(selectedTrip)} style={{ background: '#2563eb', border: 'none', padding: '10px 24px', borderRadius: '30px', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}>
                                    Book Now - ₹{selectedTrip.price}
                                </button>
                            </div>
                        </div>

                        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 60px' }}>
                            {/* Hero Gallery */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gridTemplateRows: '200px 200px', gap: '10px', borderRadius: '16px', overflow: 'hidden', marginBottom: '40px', marginTop: '-40px' }}>
                                <img src={selectedTrip.heroImage || selectedTrip.image} style={{ width: '100%', height: '100%', objectFit: 'cover', gridRow: 'span 2' }} />
                                {(selectedTrip.gallery || [selectedTrip.heroImage, selectedTrip.heroImage]).slice(0, 2).map((img, i) => (
                                    <img key={i} src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ))}
                            </div>

                            {/* Info Section */}
                            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                                <div style={{ flex: '2' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{selectedTrip.category}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}><Star size={14} fill="#fbbf24"/> {selectedTrip.rating}</span>
                                    </div>
                                    <h1 style={{ fontSize: '42px', margin: '0 0 10px 0' }}>{selectedTrip.destination}</h1>
                                    <p style={{ color: '#94a3b8', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
                                        <MapPin size={18} /> {selectedTrip.state}, {selectedTrip.country || 'India'}
                                    </p>
                                    
                                    <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '40px' }}>
                                        {selectedTrip.description}
                                    </p>

                                    <h2 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Trip Overview</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '10px', borderRadius: '50%' }}><Clock size={20} color="#3b82f6" /></div>
                                            <div><div style={{ color: '#94a3b8', fontSize: '12px' }}>Duration</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedTrip.duration}</div></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '50%' }}><Calendar size={20} color="#10b981" /></div>
                                            <div><div style={{ color: '#94a3b8', fontSize: '12px' }}>Best Time</div><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedTrip.bestTime || 'Anytime'}</div></div>
                                        </div>
                                    </div>

                                    <h2 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Day-wise Itinerary</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {(selectedTrip.itinerary || [{ day: 1, title: 'Arrival & Explore', activities: ['Check-in to hotel', 'Local sightseeing'] }]).map((it, idx) => (
                                            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                                    <div style={{ background: '#3b82f6', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                                                        D{it.day}
                                                    </div>
                                                    <h3 style={{ margin: 0, fontSize: '18px' }}>{it.title}</h3>
                                                </div>
                                                <ul style={{ margin: 0, paddingLeft: '55px', color: '#cbd5e1', lineHeight: '1.8' }}>
                                                    {it.activities.map((act, i) => <li key={i}>{act}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sidebar Info */}
                                <div style={{ flex: '1', position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '25px' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>
                                            ₹{selectedTrip.price.toLocaleString()} <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}>/ person</span>
                                        </div>
                                        <button onClick={() => setBookingTrip(selectedTrip)} style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>
                                            Book This Package
                                        </button>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                                            <Check size={14} color="#10b981" style={{ verticalAlign: 'middle', marginRight: '4px' }}/> Free cancellation up to 48 hours
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '25px' }}>
                                        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Package Inclusions</h3>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#cbd5e1' }}>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Map size={16} color="#3b82f6"/> Transport: {selectedTrip.transport || 'Included'}</li>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Search size={16} color="#3b82f6"/> Hotel: {selectedTrip.hotel || '3-Star Accommodation'}</li>
                                            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Star size={16} color="#3b82f6"/> Meals: {selectedTrip.meals || 'Breakfast Included'}</li>
                                        </ul>
                                    </div>

                                    {/* Weather Widget */}
                                    <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', borderRadius: '16px', padding: '25px', color: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>Current Weather</h3>
                                                <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '10px' }}>28°C</div>
                                                <div style={{ fontSize: '14px', opacity: 0.9 }}>{selectedTrip.weather || 'Partly Cloudy'}</div>
                                            </div>
                                            <Sun size={48} color="#fde047" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── BOOK NOW MODAL (Checkout Flow) ── */}
            <AnimatePresence>
                {bookingTrip && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
                    >
                        <div style={{ width: '100%', maxWidth: '600px', background: '#121212', border: '1px solid rgba(255,255,255,0.1)', padding: '30px', position: 'relative', borderRadius: '16px' }}>
                            <button onClick={() => setBookingTrip(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={24} /></button>
                            <h2 style={{ margin: '0 0 25px', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                                Finalize Booking: {bookingTrip.destination}
                            </h2>
                            <form onSubmit={handleBookNowSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '14px' }}>Travel Date</label>
                                    <input type="date" required value={bookingForm.travelDate} onChange={e => setBookingForm({...bookingForm, travelDate: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', outline: 'none', colorScheme: 'dark' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '14px' }}>Adults</label>
                                        <input type="number" min="1" required value={bookingForm.adults} onChange={e => setBookingForm({...bookingForm, adults: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '14px' }}>Children (50% Off)</label>
                                        <input type="number" min="0" value={bookingForm.children} onChange={e => setBookingForm({...bookingForm, children: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', outline: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)', padding: '20px', borderRadius: '8px', marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '10px', fontWeight: 'bold', fontSize: '18px' }}>
                                        <span style={{ color: '#3b82f6' }}>Total Amount</span>
                                        <span style={{ color: 'white' }}>₹{(bookingTrip.price * (parseInt(bookingForm.adults) + (parseInt(bookingForm.children) * 0.5))).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button type="submit" style={{ width: '100%', padding: '15px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>
                                    Proceed to Cart & Checkout
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default TripTable;
