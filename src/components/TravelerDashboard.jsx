import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Book, User, Settings, MapPin, Navigation, BookOpen, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Barcode = () => (
  <div style={{ display: 'flex', height: '24px', alignItems: 'center', background: 'white', padding: '4px 8px', borderRadius: '4px', gap: '2px', width: 'fit-content' }}>
    {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1].map((w, idx) => (
      <div key={idx} style={{ width: `${w}px`, height: '100%', background: 'black' }} />
    ))}
  </div>
);

const TravelerDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('bookings');
    const [preferences, setPreferences] = useState({});
    const [stories, setStories] = useState([]);
    const [communityPlaces, setCommunityPlaces] = useState([]);
    
    // Hidden Gems Modal State
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [placeForm, setPlaceForm] = useState({ placeName: '', category: 'hidden-gem', description: '', location: '' });
    
    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('appTheme') || 'light');
    
    const navigate = useNavigate();

    // Theme logic
    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('appTheme', newTheme);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const ax = axios.create({ headers: { Authorization: `Bearer ${token}` } });
        
        ax.get('/api/auth/me')
            .then(res => {
                setUser(res.data);
                // Fetch preferences and stories using user ID
                ax.get(`/api/preferences/${res.data._id}`)
                  .then(pRes => setPreferences(pRes.data))
                  .catch(console.error);
                  
                ax.get(`/api/stories/user/${res.data._id}`)
                  .then(sRes => setStories(sRes.data))
                  .catch(console.error);
            })
            .catch(() => navigate('/login'));

        ax.get('/api/bookings/my')
            .then(res => setBookings(res.data))
            .catch(console.error);
            
        ax.get('/api/community/approved')
            .then(res => setCommunityPlaces(res.data))
            .catch(console.error);
            
    }, [navigate]);

    const handleLogout = () => {
        ['token', 'role', 'username', 'name', 'email', 'profilePicture'].forEach(k => localStorage.removeItem(k));
        window.dispatchEvent(new Event('authChange'));
        navigate('/');
    };
    
    const savePreferences = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/preferences/${user._id}`, preferences, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Preferences saved successfully!');
        } catch(err) {
            alert('Error saving preferences');
        }
    };
    
    const handleSubmitPlace = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/community/submit', placeForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommunityPlaces([res.data.place, ...communityPlaces]);
            setShowSubmitModal(false);
            setPlaceForm({ placeName: '', category: 'hidden-gem', description: '', location: '' });
            alert('Place submitted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to submit place');
        }
    };

    if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2>Welcome Back, {user.username}!</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: 'inherit' }}>
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} 
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
                <button className={`btn ${activeTab === 'bookings' ? 'btn-accent' : ''}`} onClick={() => setActiveTab('bookings')} style={{ background: activeTab !== 'bookings' ? 'rgba(255,255,255,0.1)' : '' }}>
                    <Navigation size={18} /> My Trips
                </button>
                <button className={`btn ${activeTab === 'stories' ? 'btn-accent' : ''}`} onClick={() => setActiveTab('stories')} style={{ background: activeTab !== 'stories' ? 'rgba(255,255,255,0.1)' : '' }}>
                    <BookOpen size={18} /> Travel Stories
                </button>
                <button className={`btn ${activeTab === 'preferences' ? 'btn-accent' : ''}`} onClick={() => setActiveTab('preferences')} style={{ background: activeTab !== 'preferences' ? 'rgba(255,255,255,0.1)' : '' }}>
                    <Settings size={18} /> Preferences
                </button>
                <button className={`btn ${activeTab === 'community' ? 'btn-accent' : ''}`} onClick={() => setActiveTab('community')} style={{ background: activeTab !== 'community' ? 'rgba(255,255,255,0.1)' : '' }}>
                    <MapPin size={18} /> Hidden Gems
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '30px' }}>
                
                {activeTab === 'bookings' && (
                    <>
                        <h3 style={{ marginBottom: '20px' }}>My Trips</h3>
                        {bookings.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>You have no trips yet. Go to the Chatbot to plan your next trip!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {bookings.map(book => {
                                    const isConfirmed = book.status === 'Confirmed';
                                    const hasTravelers = book.travelers && book.travelers.length > 0;
                                    const travelerType = book.travelerType || 'Solo Traveler';
                                    const mockPnr = book.pnr || `REF-${book._id.substring(18).toUpperCase()}`;

                                    return (
                                        <div key={book._id} className="glass-panel" style={{
                                            padding: 0,
                                            borderRadius: '16px',
                                            border: book.externalBooking ? '1px solid rgba(0, 100, 255, 0.4)' : '1px solid var(--border)',
                                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {/* Top Header Bar */}
                                            <div style={{
                                                background: 'linear-gradient(90deg, #1e1b4b, #312e81)',
                                                padding: '15px 20px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '22px' }}>{book.externalBooking ? '🌍' : '✈️'}</span>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '18px', color: 'white', fontWeight: '700' }}>{book.destination?.name || 'Custom Package'}</h4>
                                                        <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                            {travelerType} &bull; {book.fromCity || 'Bangalore'} to {book.destination?.name || 'Destination'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                                    background: book.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.2)' : book.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: book.status === 'Confirmed' ? '#10b981' : book.status === 'Cancelled' ? '#ef4444' : '#f59e0b',
                                                    border: `1px solid ${book.status === 'Confirmed' ? '#10b981' : book.status === 'Cancelled' ? '#ef4444' : '#f59e0b'}`
                                                }}>
                                                    {book.status.toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Core Info Section */}
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.5px' }}>📅 TRAVEL DATE</div>
                                                    <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{new Date(book.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                </div>
                                                
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.5px' }}>🎟️ BOOKING PNR</div>
                                                    <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{mockPnr}</div>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.5px' }}>👥 PASSENGERS</div>
                                                    <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>{book.numberOfPeople} {book.numberOfPeople === 1 ? 'Traveler' : 'Travelers'}</div>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.5px' }}>💰 TOTAL COST</div>
                                                    <div style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '14px' }}>₹{book.totalCost ? book.totalCost.toLocaleString('en-IN') : 'N/A'}</div>
                                                </div>
                                            </div>

                                            {/* Upgrades Breakdown (If platform booked) */}
                                            {!book.externalBooking && (
                                                <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: '20px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>🚀</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>Transport:</span>
                                                        <strong style={{ color: 'var(--text-main)' }}>{book.transport?.name || 'Self-arranged'}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>🏨</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>Stay:</span>
                                                        <strong style={{ color: 'var(--text-main)' }}>{book.stay?.name || 'Self-arranged'}</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span>🍽️</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>Meal Plan:</span>
                                                        <strong style={{ color: 'var(--text-main)' }}>{book.food?.mealPlan ? `${book.food.preference || 'No Pref'} (${book.food.mealPlan})` : 'Self-arranged'}</strong>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Traveler Boarding Passes */}
                                            {hasTravelers && (
                                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                                                    <h5 style={{ margin: '0 0 15px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>🎟️ Traveler Boarding Passes</h5>
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                        {book.travelers.map((t, tIdx) => {
                                                            const hasReqs = t.specialRequirements && Object.values(t.specialRequirements).some(v => v === true || (typeof v === 'string' && v !== 'No Preference'));
                                                            return (
                                                                <div key={tIdx} style={{
                                                                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                                                                    borderRadius: '12px',
                                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                                    display: 'flex',
                                                                    overflow: 'hidden',
                                                                    position: 'relative',
                                                                    borderLeft: '4px solid var(--accent)'
                                                                }}>
                                                                    
                                                                    {/* Boarding Pass Left (Main Section) */}
                                                                    <div style={{ flex: 1, padding: '15px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                                                        <div>
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Passenger Name</div>
                                                                            <strong style={{ fontSize: '13px', color: 'white' }}>{t.name}</strong>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Category / Age</div>
                                                                            <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{t.ageCategory} ({t.age} yrs)</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Gender</div>
                                                                            <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>{t.gender}</div>
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Contact details</div>
                                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.mobile || '—'}<br/>{t.email || '—'}</div>
                                                                        </div>
                                                                        
                                                                        {/* Special requirements line */}
                                                                        {hasReqs && (
                                                                            <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                                {t.specialRequirements.wheelchair && (
                                                                                    <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>♿ Wheelchair</span>
                                                                                )}
                                                                                {t.specialRequirements.seniorAssistance && (
                                                                                    <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>🤝 Sr. Assistance</span>
                                                                                )}
                                                                                {t.specialRequirements.extraLuggage && (
                                                                                    <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>🧳 Extra Luggage</span>
                                                                                )}
                                                                                {t.specialRequirements.mealPreference && t.specialRequirements.mealPreference !== 'No Preference' && (
                                                                                    <span style={{ fontSize: '11px', background: 'rgba(129, 140, 248, 0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>🥗 {t.specialRequirements.mealPreference}</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Boarding Pass Tear-Off Separator (Dotted border) */}
                                                                    <div style={{
                                                                        width: '1px',
                                                                        borderLeft: '2px dashed rgba(255, 255, 255, 0.15)',
                                                                        margin: '10px 0',
                                                                        position: 'relative'
                                                                    }}>
                                                                        {/* Half circles mimicking tear-offs */}
                                                                        <div style={{ position: 'absolute', top: '-15px', left: '-7px', width: '12px', height: '12px', background: 'var(--bg-main)', borderRadius: '50%' }} />
                                                                        <div style={{ position: 'absolute', bottom: '-15px', left: '-7px', width: '12px', height: '12px', background: 'var(--bg-main)', borderRadius: '50%' }} />
                                                                    </div>

                                                                    {/* Boarding Pass Right Section (Stub) */}
                                                                    <div style={{
                                                                        width: '140px',
                                                                        padding: '15px',
                                                                        background: 'rgba(0,0,0,0.15)',
                                                                        display: 'flex',
                                                                        flexDirection: 'column',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '8px',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', textAlign: 'center' }}>Boarding Stub</div>
                                                                        <Barcode />
                                                                        <div style={{ fontSize: '9px', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 'bold' }}>{mockPnr}-{tIdx+1}</div>
                                                                    </div>
                                                                    
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bottom Actions Bar */}
                                            <div style={{
                                                padding: '15px 20px',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    Booked on: {new Date(book.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {isConfirmed && !book.tripCompleted && (
                                                        <button className="btn btn-accent" style={{ padding: '6px 15px', fontSize: '13px', fontWeight: '600' }} onClick={async () => {
                                                            const token = localStorage.getItem('token');
                                                            await axios.post('/api/stories/generate', { bookingId: book._id, userId: user.id }, { headers: { Authorization: `Bearer ${token}` } });
                                                            alert("Trip marked as complete! A travel story has been generated by AI.");
                                                            window.location.reload();
                                                        }}>
                                                            ✅ Complete Trip
                                                        </button>
                                                    )}
                                                    {book.tripCompleted && (
                                                        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 'bold' }}>🏁 Trip Completed</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
                
                {activeTab === 'stories' && (
                    <>
                        <h3 style={{ marginBottom: '20px' }}>My AI Travel Stories</h3>
                        {stories.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>You haven't completed any trips yet. Complete a trip to get an AI-generated travel diary!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {stories.map(story => (
                                    <div key={story._id} className="story-card">
                                        <h4 style={{ fontSize: '20px', marginBottom: '5px' }}>{story.title}</h4>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '15px' }}>
                                            {new Date(story.startDate).toLocaleDateString()} • ₹{story.totalBudget} spent
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '15px', fontStyle: 'italic', borderLeft: '3px solid var(--accent)' }}>
                                            "{story.summary}"
                                        </div>
                                        <h5>Travel Diary</h5>
                                        <p style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: '1.6' }}>{story.diary}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
                
                {activeTab === 'preferences' && (
                    <form onSubmit={savePreferences}>
                        <h3 style={{ marginBottom: '20px' }}>Travel Preferences (AI Memory)</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>These preferences will be remembered by the AI companion.</p>
                        
                        <div className="form-group">
                            <label>Budget Preference</label>
                            <select value={preferences.budgetPreference || 'mid-range'} onChange={(e) => setPreferences({...preferences, budgetPreference: e.target.value})}>
                                <option value="budget">Budget</option>
                                <option value="mid-range">Mid-Range</option>
                                <option value="luxury">Luxury</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Dietary Preference</label>
                            <select value={preferences.dietaryPreference || 'both'} onChange={(e) => setPreferences({...preferences, dietaryPreference: e.target.value})}>
                                <option value="veg">Vegetarian</option>
                                <option value="non-veg">Non-Vegetarian</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Preferred Language</label>
                            <select value={preferences.preferredLanguage || 'en'} onChange={(e) => setPreferences({...preferences, preferredLanguage: e.target.value})}>
                                <option value="en">English</option>
                                <option value="hi">Hindi (हिंदी)</option>
                                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                            </select>
                        </div>
                        
                        <button type="submit" className="btn btn-accent">Save Preferences</button>
                    </form>
                )}
                
                {activeTab === 'community' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Community Hidden Gems</h3>
                            <button className="btn" onClick={() => setShowSubmitModal(true)}>Submit Place</button>
                        </div>
                        {communityPlaces.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No hidden gems discovered yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                                {communityPlaces.map(place => (
                                    <div key={place._id} className="dest-card">
                                        <h4>{place.placeName}</h4>
                                        <p style={{ fontSize: '12px', color: 'var(--accent)', marginBottom: '10px' }}>{place.category.toUpperCase()}</p>
                                        <p style={{ fontSize: '14px', marginBottom: '10px' }}>{place.description}</p>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            📍 {place.location}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {showSubmitModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Submit a Hidden Gem</h3>
                        <form onSubmit={handleSubmitPlace} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>Place Name</label>
                                <input type="text" className="form-control" required value={placeForm.placeName} onChange={(e) => setPlaceForm({...placeForm, placeName: e.target.value})} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>Category</label>
                                <select className="form-control" value={placeForm.category} onChange={(e) => setPlaceForm({...placeForm, category: e.target.value})} style={{ width: '100%' }}>
                                    <option value="hidden-gem">Hidden Gem</option>
                                    <option value="local-food">Local Food</option>
                                    <option value="scenic">Scenic Spot</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>Location</label>
                                <input type="text" className="form-control" required placeholder="e.g. Malpe, Udupi" value={placeForm.location} onChange={(e) => setPlaceForm({...placeForm, location: e.target.value})} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#cbd5e1' }}>Description</label>
                                <textarea className="form-control" rows="3" required value={placeForm.description} onChange={(e) => setPlaceForm({...placeForm, description: e.target.value})} style={{ width: '100%', resize: 'vertical' }}></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit</button>
                                <button type="button" className="btn" onClick={() => setShowSubmitModal(false)} style={{ flex: 1, background: '#333' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default TravelerDashboard;
