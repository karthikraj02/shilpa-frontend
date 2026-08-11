import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const UserForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
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
            await axios.post('/api/auth/forgot-password', { email: email.trim() });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .forgot-password-bg {
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

                .forgot-password-bg::before {
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

                .forgot-password-bg::after {
                    content: '';
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(0, 40, 160, 0.06) 0%, transparent 70%);
                    bottom: -100px;
                    right: 10%;
                    pointer-events: none;
                }

                .forgot-card {
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

                .forgot-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 50%; transform: translateX(-50%);
                    width: 60%; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(0, 85, 255, 0.6), transparent);
                    border-radius: 50%;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #64748b;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 24px;
                    transition: color 0.2s;
                }

                .back-link:hover { color: #3b82f6; }

                .forgot-title {
                    color: #f1f5f9;
                    font-size: 26px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    margin-bottom: 8px;
                }

                .forgot-subtitle {
                    color: #64748b;
                    font-size: 14px;
                    margin-bottom: 32px;
                    line-height: 1.6;
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

                .forgot-input {
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

                .forgot-input:focus {
                    border-color: rgba(0, 85, 255, 0.6);
                    background: rgba(0, 85, 255, 0.05);
                    box-shadow: 0 0 0 3px rgba(0, 85, 255, 0.1), 0 0 20px rgba(0, 85, 255, 0.08);
                }

                .forgot-input:focus + .field-icon,
                .field-wrap:focus-within .field-icon {
                    color: #3b82f6;
                }

                .forgot-input::placeholder { color: #334155; }

                .forgot-error {
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

                .forgot-success {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    padding: 14px 16px;
                    margin-bottom: 20px;
                    color: #6ee7b7;
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 0 16px rgba(16, 185, 129, 0.08);
                }

                .forgot-submit {
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

                .forgot-submit:hover:not(:disabled) {
                    background: linear-gradient(135deg, #0066ff, #0047cc);
                    box-shadow: 0 6px 32px rgba(0, 85, 255, 0.5), 0 0 0 1px rgba(0, 85, 255, 0.3);
                    transform: translateY(-1px);
                }

                .forgot-submit:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                    transform: none;
                }

                .forgot-footer {
                    text-align: center;
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(0, 85, 255, 0.12);
                    font-size: 13px;
                    color: #475569;
                }

                .forgot-footer a {
                    color: #3b82f6;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.2s;
                }

                .forgot-footer a:hover { color: #60a5fa; text-decoration: underline; }

                @media (max-width: 480px) {
                    .forgot-card { padding: 36px 24px; }
                }
            `}</style>

            <div className="forgot-password-bg">
                <div className="forgot-card">
                    <Link to="/login" className="back-link">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>

                    <h1 className="forgot-title">Forgot Password?</h1>
                    <p className="forgot-subtitle">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="forgot-error">
                            <AlertCircle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="forgot-success">
                            <CheckCircle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
                            <span>
                                If this email is registered, a reset link has been sent to your inbox.
                                Please check your email and follow the instructions.
                            </span>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit} noValidate>
                            {/* Email */}
                            <div className="field-group">
                                <label className="field-label" htmlFor="forgot-email">Email</label>
                                <div className="field-wrap">
                                    <Mail size={16} className="field-icon" />
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        className="forgot-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="forgot-submit"
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}

                    <div className="forgot-footer">
                        Remember your password? <Link to="/login">Sign in</Link>
                        <br /><br />
                        <Link to="/admin/login">Admin Login →</Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserForgotPassword;
