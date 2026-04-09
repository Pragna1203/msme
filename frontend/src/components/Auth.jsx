import React, { useState } from 'react';
import './Auth.css';

const Auth = ({ setToken }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const endpoint = isLogin ? '/auth/login' : '/auth/signup';
        
        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error);
                return;
            }

            if (isLogin) {
                setToken(data.token);
                localStorage.setItem('msme_token', data.token);
            } else {
                setIsLogin(true);
                setError('Signup successful! Please login.');
            }
        } catch (err) {
            setError('Server connection failed.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box glass-panel animate-fade-in">
                <div className="auth-logo">🤖</div>
                <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="auth-subtitle">MSME AI Business Insights</p>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="auth-btn">
                        {isLogin ? 'Login to Dashboard' : 'Sign Up'}
                    </button>
                </form>
                
                <div className="auth-switch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign up' : 'Login'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Auth;
