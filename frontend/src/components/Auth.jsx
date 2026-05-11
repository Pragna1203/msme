import React, { useState, useEffect, useRef } from 'react';
import './Auth.css';

const Auth = ({ setToken }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Forgot Password states
    const [forgotView, setForgotView] = useState(null); // null | 'forgot' | 'reset'
    const [otp, setOtp] = useState('');
    
    const emailInputRef = useRef(null);

    // Auto-focus the first input field on load or when switching modes
    useEffect(() => {
        if (emailInputRef.current) {
            emailInputRef.current.focus();
        }
    }, [isLogin]);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isFormValid = () => {
        if (isLogin) {
            return validateEmail(email) && password.length >= 6;
        } else {
            return (
                fullName.trim() !== '' &&
                validateEmail(email) &&
                password.length >= 6 &&
                password === confirmPassword
            );
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setMessage({ type: '', text: '' });
        // Fields are cleared naturally if we wanted, but let's keep it clean
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`http://localhost:5000/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Failed to send OTP' });
                setLoading(false);
                return;
            }

            setMessage({ type: 'success', text: 'OTP sent to your email successfully!' });
            setForgotView('reset');
        } catch (err) {
            setMessage({ type: 'error', text: 'Server connection failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
             setMessage({ type: 'error', text: 'Password must be at least 8 characters, with 1 uppercase letter and 1 number.' });
             return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch(`http://localhost:5000/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword: password })
            });
            const data = await res.json();
            
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Failed to reset password' });
                setLoading(false);
                return;
            }

            setMessage({ type: 'success', text: 'Password reset successful! Please log in.' });
            setForgotView(null);
            setPassword('');
            setConfirmPassword('');
            setOtp('');
        } catch (err) {
            setMessage({ type: 'error', text: 'Server connection failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;

        setLoading(true);
        setMessage({ type: '', text: '' });
        
        const endpoint = isLogin ? '/auth/login' : '/auth/signup';
        
        try {
            const body = { 
                username: email, 
                password: password,
                fullName: fullName // Added for Settings support
            };
            
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || 'Authentication failed' });
                setLoading(false);
                return;
            }

            if (isLogin) {
                localStorage.setItem('msme_token', data.token);
                setToken(data.token); // Redirect happens in parent App
            } else {
                setMessage({ type: 'success', text: 'Account created! Please login.' });
                setIsLogin(true);
                // Reset password fields
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Server connection failed. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    if (forgotView) {
        return (
            <div className="auth-container">
                <div className="auth-card animate-fade-in">
                    <div className="auth-header">
                        <div className="auth-robot-icon">🔐</div>
                        <h1>{forgotView === 'forgot' ? 'Reset Password' : 'Create New Password'}</h1>
                        <p>{forgotView === 'forgot' ? 'Enter your email to receive an OTP' : 'Enter the OTP and your new password'}</p>
                    </div>

                    {message.text && (
                        <div className={`auth-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={forgotView === 'forgot' ? handleForgotSubmit : handleResetSubmit} className="auth-form">
                        {forgotView === 'forgot' && (
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    placeholder="Registered Email Address" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {forgotView === 'reset' && (
                            <>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        placeholder="Enter 6-digit OTP" 
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        placeholder="New Password" 
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        placeholder="Confirm New Password" 
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <button 
                            type="submit" 
                            className="auth-primary-btn"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (forgotView === 'forgot' ? 'Send Reset Link' : 'Reset Password')}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>Remembered your password? <span onClick={() => { setForgotView(null); setMessage({ type: '', text: '' }); }}>Back to Login</span></p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in">
                <div className="auth-header">
                    <div className="auth-robot-icon">🤖</div>
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>BizSense AI Business Insights</p>
                </div>

                {message.text && (
                    <div className={`auth-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    
                    <div className="input-group">
                        <input 
                            ref={emailInputRef}
                            type="email" 
                            placeholder="Email Address" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        {isLogin && (
                            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                                <span 
                                    style={{ fontSize: '0.85rem', color: 'var(--accent-color, #4f46e5)', cursor: 'pointer' }}
                                    onClick={() => { setForgotView('forgot'); setMessage({ type: '', text: '' }); setPassword(''); }}
                                >
                                    Forgot Password?
                                </span>
                            </div>
                        )}
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <input 
                                type="password" 
                                placeholder="Confirm Password" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="auth-primary-btn"
                        disabled={loading || !isFormValid()}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login to Dashboard' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLogin ? (
                        <p>Don't have an account? <span onClick={toggleMode}>Sign up</span></p>
                    ) : (
                        <p>Already have an account? <span onClick={toggleMode}>Login</span></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Auth;
