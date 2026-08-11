import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // If already logged in as admin, redirect straight to dashboard
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token && role === 'admin') navigate('/admin/dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post('/api/auth/admin-login', { email, password });
            const { token, role, username, name, email: userEmail, profilePicture } = res.data;

            // Store all auth data
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('username', username || '');
            localStorage.setItem('name', name || '');
            localStorage.setItem('email', userEmail || '');
            if (profilePicture) localStorage.setItem('profilePicture', profilePicture);

            window.dispatchEvent(new Event('authChange'));
            navigate('/admin/dashboard');
        } catch (err) {
            const serverMsg = err?.response?.data?.msg;
            setError(serverMsg || 'Invalid Admin Email or Password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .admin-login-bg {
                    min-height: 100vh;
                    background: #000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .admin-login-bg::before {
                    content: '';
                    position: absolute;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(0, 85, 255, 0.08) 0%, transparent 70%);
                    top: -100px;
                    left: 50%;
                    transform: translateX(-50%);
                    pointer-events: none;
                }

                .admin-login-bg::after {
                    content: '';
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(0, 40, 160, 0.06) 0%, transparent 70%);
                    bottom: -100px;
                    right: 10%;
                    pointer-events: none;
                }

                .admin-card {
                    width: 100%;
                    max-width: 420px;
                    background: rgba(8, 12, 28, 0.92);
                    border: 1px solid rgba(0, 85, 255, 0.35);
                    border-radius: 24px;
                    padding: 48px 40px;
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    box-shadow:
                        0 0 0 1px rgba(0, 85, 255, 0.1),
                        0 0 40px rgba(0, 85, 255, 0.12),
                        0 0 80px rgba(0, 40, 160, 0.08),
                        0 32px 80px rgba(0, 0, 0, 0.8);
                    position: relative;
                    animation: cardIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
                }

                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(32px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)    scale(1); }
                }

                .admin-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 50%; transform: translateX(-50%);
                    width: 60%; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(0, 85, 255, 0.6), transparent);
                    border-radius: 50%;
                }

                .admin-icon-wrap {
                    width: 64px; height: 64px;
                    background: linear-gradient(135deg, rgba(0, 85, 255, 0.15), rgba(0, 40, 160, 0.1));
                    border: 1px solid rgba(0, 85, 255, 0.4);
                    border-radius: 18px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 24px;
                    box-shadow: 0 0 24px rgba(0, 85, 255, 0.2);
                }

                .admin-title {
                    text-align: center;
                    color: #f1f5f9;
                    font-size: 26px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    margin-bottom: 6px;
                }

                .admin-subtitle {
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    margin-bottom: 36px;
                }

                .admin-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0, 85, 255, 0.1);
                    border: 1px solid rgba(0, 85, 255, 0.3);
                    border-radius: 20px;
                    padding: 4px 14px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #60a5fa;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin: 0 auto 16px;
                    display: flex;
                    justify-content: center;
                    width: fit-content;
                    margin-left: auto;
                    margin-right: auto;
                    margin-bottom: 12px;
                }

                .field-group {
                    margin-bottom: 18px;
                }

                .field-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: #94a3b8;
                    margin-bottom: 8px;
                    letter-spacing: 0.3px;
                }

                .field-wrap {
                    position: relative;
                }

                .field-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #475569;
                    pointer-events: none;
                    transition: color 0.2s;
                }

                .admin-input {
                    width: 100%;
                    padding: 13px 44px;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #f1f5f9;
                    font-size: 15px;
                    font-family: 'Inter', sans-serif;
                    outline: none;
                    transition: all 0.2s;
                }

                .admin-input:focus {
                    border-color: rgba(0, 85, 255, 0.6);
                    background: rgba(0, 85, 255, 0.05);
                    box-shadow: 0 0 0 3px rgba(0, 85, 255, 0.1), 0 0 20px rgba(0, 85, 255, 0.08);
                }

                .admin-input:focus + .field-icon,
                .field-wrap:focus-within .field-icon {
                    color: #3b82f6;
                }

                .admin-input::placeholder { color: #334155; }

                .pwd-toggle {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #475569;
                    cursor: pointer;
                    padding: 4px;
                    transition: color 0.2s;
                    display: flex; align-items: center;
                }
                .pwd-toggle:hover { color: #94a3b8; }

                .admin-error {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    padding: 14px 16px;
                    margin-bottom: 20px;
                    color: #fca5a5;
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 0 16px rgba(239, 68, 68, 0.08);
                    animation: shakeIn 0.3s ease;
                }

                @keyframes shakeIn {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-4px); }
                    40%, 80% { transform: translateX(4px); }
                }

                .admin-submit {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #0055ff, #003db3);
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 15px;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 24px rgba(0, 85, 255, 0.35), 0 0 0 1px rgba(0, 85, 255, 0.2);
                    margin-top: 8px;
                    letter-spacing: 0.3px;
                }

                .admin-submit:hover:not(:disabled) {
                    background: linear-gradient(135deg, #0066ff, #0047cc);
                    box-shadow: 0 6px 32px rgba(0, 85, 255, 0.5), 0 0 0 1px rgba(0, 85, 255, 0.3);
                    transform: translateY(-1px);
                }

                .admin-submit:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                    transform: none;
                }

                .admin-footer {
                    text-align: center;
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(0, 85, 255, 0.12);
                    font-size: 13px;
                    color: #475569;
                }

                .admin-footer a {
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }

                .admin-footer a:hover { color: #60a5fa; text-decoration: underline; }

                .spin { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 480px) {
                    .admin-card { padding: 36px 24px; }
                }
            `}</style>

            <div className="admin-login-bg">
                <div className="admin-card">
                    {/* Icon */}
                    <div className="admin-icon-wrap">
                        <Shield size={30} color="#3b82f6" strokeWidth={1.5} />
                    </div>

                    {/* Badge */}
                    <div className="admin-badge">
                        <Shield size={10} />
                        Secure Admin Portal
                    </div>

                    <h1 className="admin-title">Admin Login</h1>
                    <p className="admin-subtitle">Sign in to access the admin dashboard</p>

                    {/* Error */}
                    {error && (
                        <div className="admin-error">
                            <AlertCircle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} noValidate>
                        {/* Email */}
                        <div className="field-group">
                            <label className="field-label" htmlFor="admin-email">Admin Email</label>
                            <div className="field-wrap">
                                <Mail size={16} className="field-icon" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', position: 'absolute', color: '#475569', pointerEvents: 'none' }} />
                                <input
                                    id="admin-email"
                                    type="email"
                                    className="admin-input"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="field-group">
                            <label className="field-label" htmlFor="admin-password">Password</label>
                            <div className="field-wrap">
                                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="admin-input"
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="pwd-toggle"
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="admin-login-submit"
                            type="submit"
                            className="admin-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={17} className="spin" />
                                    Authenticating…
                                </>
                            ) : (
                                <>
                                    <Shield size={17} />
                                    Sign In as Admin
                                </>
                            )}
                        </button>
                    </form>

                    <div className="admin-footer">
                        Not an admin?{' '}
                        <Link to="/login">Go to User Login →</Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;
