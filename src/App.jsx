import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Bot, ShoppingCart, Map, LogOut, User, Bookmark, LayoutDashboard, ChevronDown } from 'lucide-react';
import Chatbot from './components/Chatbot';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminOverview from './components/AdminOverview';
import AdminDestinations from './components/AdminDestinations';
import AdminBookings from './components/AdminBookings';
import AdminTripPlans from './components/AdminTripPlans';
import AdminUsers from './components/AdminUsers';
import AdminReviews from './components/AdminReviews';
import AdminTransport from './components/AdminTransport';
import AdminHiddenGems from './components/AdminHiddenGems';
import AdminFeedbackDashboard from './components/AdminFeedbackDashboard';
import TripTable from './components/TripTable';
import CartPage from './components/CartPage';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import UserForgotPassword from './components/UserForgotPassword';
import TravelerDashboard from './components/TravelerDashboard';
import SuccessPage from './components/SuccessPage';
import CancelPage from './components/CancelPage';
import MyTrips from './components/MyTrips';
import ResetPassword from './components/ResetPassword';
import SubmitReviewPage from './components/SubmitReviewPage';

// ── Protected Route — requires any logged-in user
const ProtectedRoute = ({ children, token }) => {
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// ── Admin Protected Route — requires admin role
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token || role !== 'admin') return <Navigate to="/admin/login" replace />;
  return children;
};

// ── User Protected Route — requires user role (not admin)
const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

// ── Profile Dropdown Component
const ProfileDropdown = ({ profilePicture, name, username, email, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = name || username || email?.split('@')[0] || 'My Account';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id="profile-dropdown-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: open ? 'rgba(0,85,255,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${open ? 'rgba(0,85,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '10px', padding: '6px 12px 6px 6px',
          cursor: 'pointer', color: '#f1f5f9', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,85,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,85,255,0.4)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
      >
        {profilePicture ? (
          <img src={profilePicture} alt="Profile"
            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid rgba(0,85,255,0.5)', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0055ff, #003db3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#fff',
          }}>
            {initials}
          </div>
        )}
        <span style={{ fontSize: '14px', fontWeight: '500', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </span>
        <ChevronDown size={14} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: '0',
          background: 'rgba(8,12,24,0.97)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,85,255,0.25)', borderRadius: '14px',
          minWidth: '220px', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 40px rgba(0,85,255,0.08)',
          zIndex: 1000, overflow: 'hidden', animation: 'dropdownIn 0.2s ease',
        }}>
          {/* User info header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,85,255,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profilePicture ? (
                <img src={profilePicture} alt="Profile"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(0,85,255,0.4)', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0055ff, #003db3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: '700', color: '#fff',
                }}>
                  {initials}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email || ''}</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          {[
            { icon: LayoutDashboard, label: 'My Profile', path: '/dashboard' },
            { icon: Map, label: 'My Trips', path: '/mytrips' },
            { icon: Bookmark, label: 'Saved Chats', path: '/' },
          ].map(({ icon: Icon, label, path }) => (
            <button key={label}
              onClick={() => { setOpen(false); navigate(path); }}
              style={dropdownItemStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,85,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}

          <div style={{ borderTop: '1px solid rgba(0,85,255,0.15)', marginTop: '4px', paddingTop: '4px' }}>
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              style={{ ...dropdownItemStyle, color: '#f87171' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const dropdownItemStyle = {
  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
  padding: '11px 16px', background: 'transparent', border: 'none',
  color: '#cbd5e1', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
  textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
};

// ─────────────────────────────────────────────
function App() {
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [profilePicture, setProfilePicture] = useState(localStorage.getItem('profilePicture'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [name, setName] = useState(localStorage.getItem('name'));
  const [email, setEmail] = useState(localStorage.getItem('email'));

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }

    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
      setProfilePicture(localStorage.getItem('profilePicture'));
      setUsername(localStorage.getItem('username'));
      setName(localStorage.getItem('name'));
      setEmail(localStorage.getItem('email'));
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const addToCart = (trip) => setCart(prev => [...prev, trip]);

  const handleLogout = () => {
    ['token', 'role', 'username', 'profilePicture', 'name', 'email'].forEach(k => localStorage.removeItem(k));
    setToken(null); setRole(null); setProfilePicture(null);
    setUsername(null); setName(null); setEmail(null);
    window.dispatchEvent(new Event('authChange'));
  };

  // Is the current user a regular user (not admin)?
  const isUser = token && role !== 'admin';
  // Is the current user an admin?
  const isAdmin = token && role === 'admin';

  return (
    <Router>
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auth-card-anim { animation: fadeInUp 0.35s ease; }
        button:hover { opacity: 0.92; }
      `}</style>

      <div className="app-container">
        {/* ── Navbar: only show for regular users (not for admin dashboard or public pages) */}
        {isUser && (
          <nav className="navbar">
            <Link to="/" className="navbar-logo">
              <Bot size={32} color="#818cf8" />
              AI Tourist Assistant
            </Link>
            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <Bot size={18} /> Chat
              </Link>
              <Link to="/trips" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <Map size={18} /> Trips
              </Link>
              <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                 <ShoppingCart size={18} /> Cart
              </Link>
              <ProfileDropdown
                profilePicture={profilePicture}
                name={name}
                username={username}
                email={email}
                onLogout={handleLogout}
              />
            </div>
          </nav>
        )}

        {/* Show minimal nav for logged-out users */}
        {!token && (
          <nav className="navbar">
            <Link to="/login" className="navbar-logo">
              <Bot size={32} color="#818cf8" />
              AI Tourist Assistant
            </Link>
            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <User size={17} /> Login
              </Link>
            </div>
          </nav>
        )}

        <main className="main-content">
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login" element={
              token
                ? <Navigate to={role === 'admin' ? '/admin/dashboard' : '/'} replace />
                : <UserLogin />
            } />
            <Route path="/register" element={
              token
                ? <Navigate to="/" replace />
                : <UserRegister />
            } />
            <Route path="/forgot-password" element={<UserForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ── Admin routes — separate from user routes ── */}
            <Route path="/admin/login" element={
              isAdmin
                ? <Navigate to="/admin/dashboard" replace />
                : <AdminLogin />
            } />

            {/* Legacy /admin redirect */}
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }>
              <Route index element={<AdminOverview />} />
              <Route path="users"       element={<AdminUsers />} />
              <Route path="destinations" element={<AdminDestinations />} />
              <Route path="transport"   element={<AdminTransport />} />
              <Route path="bookings"    element={<AdminBookings />} />
              <Route path="reviews"     element={<AdminReviews />} />
              <Route path="hidden-gems" element={<AdminHiddenGems />} />
              <Route path="feedback"    element={<AdminFeedbackDashboard />} />
              <Route path="tripplans"   element={<AdminTripPlans />} />
            </Route>

            {/* ── Protected user routes (regular users only) ── */}
            <Route path="/" element={
              <UserProtectedRoute>
                <Chatbot addToCart={addToCart} />
              </UserProtectedRoute>
            } />
            <Route path="/trips" element={
              <UserProtectedRoute>
                <TripTable addToCart={addToCart} />
              </UserProtectedRoute>
            } />
            <Route path="/cart" element={
              <UserProtectedRoute>
                <CartPage cart={cart} setCart={setCart} />
              </UserProtectedRoute>
            } />
            <Route path="/success" element={
              <UserProtectedRoute>
                <SuccessPage setCart={setCart} />
              </UserProtectedRoute>
            } />
            <Route path="/cancel" element={
              <UserProtectedRoute>
                <CancelPage />
              </UserProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <UserProtectedRoute>
                <TravelerDashboard />
              </UserProtectedRoute>
            } />
            <Route path="/mytrips" element={
              <UserProtectedRoute>
                <MyTrips />
              </UserProtectedRoute>
            } />
            <Route path="/review/:bookingId" element={
              <UserProtectedRoute>
                <SubmitReviewPage />
              </UserProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
