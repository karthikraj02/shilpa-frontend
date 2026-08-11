import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Auto-redirect after success
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => navigate('/login'), 3500);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    const getPasswordStrength = (pwd) => {
        if (!pwd) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
        if (score === 3) return { score, label: 'Fair', color: '#f59e0b' };
        if (score === 4) return { score, label: 'Good', color: '#3b82f6' };
        return { score, label: 'Strong', color: '#10b981' };
    };
    const pwdStrength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPwd.test(password)) {
            setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post(`/api/auth/reset-password/${token}`, { password });
            setSuccess(true);
        } catch (err) {
            setError(err?.response?.data?.msg || 'Reset failed. The link may be invalid or expired.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.bgGlow1} />
            <div style={styles.bgGlow2} />

            <div style={styles.card}>
                {/* Logo */}
                <div style={styles.header}>
                    <div style={styles.logo}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="18" fill="rgba(0,85,255,0.15)" />
                            <path d="M11 18.5C11 14.91 13.91 12 17.5 12H19V15H17.5C15.57 15 14 16.57 14 18.5S15.57 22 17.5 22H19V25H17.5C13.91 25 11 22.09 11 18.5Z" fill="#0055ff"/>
                            <path d="M25 18.5C25 22.09 22.09 25 18.5 25H17V22H18.5C20.43 22 22 20.43 22 18.5S20.43 15 18.5 15H17V12H18.5C22.09 12 25 14.91 25 18.5Z" fill="#60a5fa"/>
                        </svg>
                    </div>
                </div>

                {success ? (
                    /* ── Success State ── */
                    <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CheckCircle size={36} color="#10b981" />
                            </div>
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f8fafc', marginBottom: '10px' }}>
                            Password reset successful
                        </h2>
                        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '28px', fontSize: '14px' }}>
                            Your password has been updated. Redirecting you to login...
                        </p>
                        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', background: 'linear-gradient(90deg, #0055ff, #60a5fa)',
                                borderRadius: '4px', animation: 'progressBar 3.5s linear forwards',
                            }} />
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            style={{ ...styles.primaryBtn, marginTop: '24px' }}
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    /* ── Reset Form ── */
                    <form onSubmit={handleSubmit}>
                        <h1 style={styles.title}>Set new password</h1>
                        <p style={styles.subtitle}>Your new password must be different from previous passwords</p>

                        {error && (
                            <div style={styles.errorBox} role="alert">
                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        {/* New Password */}
                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="new-password" style={styles.label}>New password</label>
                            <div style={{ position: 'relative' }}>
                                <div style={styles.inputIcon}><Lock size={16} color="rgba(148,163,184,0.7)" /></div>
                                <input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    autoComplete="new-password"
                                    required
                                    style={{ ...styles.input, paddingLeft: '44px', paddingRight: '44px' }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(0,85,255,0.8)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,85,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(0,85,255,0.3)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button type="button" onClick={() => setShowPassword(p => !p)} style={styles.eyeBtn} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                                </button>
                            </div>
                        </div>

                        {/* Password strength */}
                        {password && (
                            <div style={{ marginBottom: '16px', marginTop: '-12px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} style={{
                                            flex: 1, height: '3px', borderRadius: '4px',
                                            background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.1)',
                                            transition: 'background 0.3s',
                                        }} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '12px', color: pwdStrength.color }}>{pwdStrength.label}</span>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '24px' }}>
                            <label htmlFor="confirm-password" style={styles.label}>Confirm password</label>
                            <div style={{ position: 'relative' }}>
                                <div style={styles.inputIcon}><Lock size={16} color="rgba(148,163,184,0.7)" /></div>
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    autoComplete="new-password"
                                    required
                                    style={{ ...styles.input, paddingLeft: '44px', paddingRight: '44px' }}
                                    onFocus={e => { e.target.style.borderColor = 'rgba(0,85,255,0.8)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,85,255,0.15)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'rgba(0,85,255,0.3)'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button type="button" onClick={() => setShowConfirmPassword(p => !p)} style={styles.eyeBtn} tabIndex={-1}>
                                    {showConfirmPassword ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={submitting} style={{ ...styles.primaryBtn, opacity: submitting ? 0.7 : 1 }}>
                            {submitting
                                ? <><Loader2 size={18} style={styles.spinner} /> Resetting password...</>
                                : 'Reset password'}
                        </button>

                        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                            Remember it?{' '}
                            <button type="button" onClick={() => navigate('/login')} style={styles.linkBtn}>
                                Back to login
                            </button>
                        </p>
                    </form>
                )}
            </div>

            <style>{`
                @keyframes progressBar {
                    from { width: 0; }
                    to { width: 100%; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh', background: '#000000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', position: 'relative', overflow: 'hidden',
    },
    bgGlow1: {
        position: 'fixed', top: '-200px', left: '-200px',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,85,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
    },
    bgGlow2: {
        position: 'fixed', bottom: '-200px', right: '-200px',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,85,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
    },
    card: {
        width: '100%', maxWidth: '420px',
        background: 'rgba(8,12,24,0.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(0,85,255,0.25)', borderRadius: '20px',
        padding: '40px 36px',
        boxShadow: '0 0 0 1px rgba(0,85,255,0.1), 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(0,85,255,0.08)',
        position: 'relative', zIndex: 1,
    },
    header: { textAlign: 'center', marginBottom: '24px' },
    logo: { display: 'flex', justifyContent: 'center' },
    title: { fontSize: '24px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px', textAlign: 'center' },
    subtitle: { color: '#64748b', fontSize: '14px', textAlign: 'center', marginBottom: '28px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#94a3b8' },
    input: {
        width: '100%', padding: '13px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,85,255,0.3)', borderRadius: '10px',
        color: '#f1f5f9', fontSize: '15px', fontFamily: 'Inter, sans-serif',
        outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
    },
    inputIcon: {
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
    },
    eyeBtn: {
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)', background: 'none', border: 'none',
        cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
    },
    primaryBtn: {
        width: '100%', padding: '14px',
        background: 'linear-gradient(135deg, #0055ff, #003db3)',
        color: '#fff', border: 'none', borderRadius: '10px',
        fontSize: '15px', fontWeight: '600', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,85,255,0.3)',
        transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
    },
    errorBox: {
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
        color: '#fca5a5', borderRadius: '10px', padding: '12px 14px',
        fontSize: '14px', lineHeight: '1.5', marginBottom: '18px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
    },
    linkBtn: {
        background: 'none', border: 'none', color: '#3b82f6',
        fontSize: '14px', fontWeight: '500', cursor: 'pointer',
        padding: '0', fontFamily: 'Inter, sans-serif',
    },
    spinner: { animation: 'spin 1s linear infinite' },
};

export default ResetPassword;
