import React, { useState } from 'react';
import { User, Palette, Globe, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import './Settings.css';

const Settings = ({ token, fullName, settings, updateUserSettings, setHistory }) => {
    const [localName, setLocalName] = useState(fullName);
    const [localSettings, setLocalSettings] = useState(settings);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState('');

    const handleSave = async () => {
        const success = await updateUserSettings(localName, localSettings);
        if (success) {
            showToast('Settings saved successfully!');
        } else {
            showToast('Failed to save settings. Please try again.');
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleClearHistory = async () => {
        try {
            const res = await fetch('http://localhost:5000/chat/history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setHistory([]);
                setShowModal(false);
                showToast('Chat history cleared!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="settings-container animate-fade-in">
            <div className="settings-header">
                <h2 className="settings-title">Settings</h2>
                <p className="settings-subtitle">Manage your account preferences and application appearance.</p>
            </div>

            <div className="settings-grid">
                {/* Profile Section */}
                <div className="settings-card glass-panel">
                    <h3><User size={20} /> Profile Details</h3>
                    <div className="settings-group">
                        <label className="settings-label">Full Display Name</label>
                        <input 
                            type="text" 
                            className="settings-input" 
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                        />
                    </div>
                    <div className="settings-group">
                        <label className="settings-label">Username / Email (Login ID - Fixed)</label>
                        <input 
                            type="text" 
                            className="settings-input" 
                            value={JSON.parse(atob(token.split('.')[1])).username}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                    </div>
                    <button className="settings-btn btn-primary" onClick={handleSave}>Save Profile</button>
                </div>


                {/* Appearance Section */}
                <div className="settings-card glass-panel">
                    <h3><Palette size={20} /> Appearance</h3>
                    <div className="settings-toggle-row">
                        <span className="settings-label">Dark Mode</span>
                        <label className="toggle-switch">
                            <input 
                                type="checkbox" 
                                checked={localSettings.theme === 'dark'}
                                onChange={(e) => {
                                    const newSettings = { ...localSettings, theme: e.target.checked ? 'dark' : 'light' };
                                    setLocalSettings(newSettings);
                                    updateUserSettings(localName, newSettings);
                                }}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="settings-group">
                        <label className="settings-label">Font Family</label>
                        <select 
                            className="settings-select"
                            value={localSettings.font}
                            onChange={(e) => {
                                const newSettings = { ...localSettings, font: e.target.value };
                                setLocalSettings(newSettings);
                                updateUserSettings(localName, newSettings);
                            }}
                        >
                            <option value="Inter">Inter (System Default)</option>
                            <option value="Poppins">Poppins (Modern)</option>
                            <option value="Roboto">Roboto (Clean)</option>
                        </select>
                    </div>

                    <div className="settings-group">
                        <label className="settings-label">Text Size</label>
                        <select 
                            className="settings-select"
                            value={localSettings.fontSize}
                            onChange={(e) => {
                                const newSettings = { ...localSettings, fontSize: e.target.value };
                                setLocalSettings(newSettings);
                                updateUserSettings(localName, newSettings);
                            }}
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium (Standard)</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                </div>

                {/* Currency Section */}
                <div className="settings-card glass-panel">
                    <h3><Globe size={20} /> Localization</h3>
                    <div className="settings-group">
                        <label className="settings-label">Preferred Currency</label>
                        <select 
                            className="settings-select"
                            value={localSettings.currency}
                            onChange={(e) => {
                                const newSettings = { ...localSettings, currency: e.target.value };
                                setLocalSettings(newSettings);
                                updateUserSettings(localName, newSettings);
                            }}
                        >
                            <option value="INR">Indian Rupee (₹)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="EUR">Euro (€)</option>
                        </select>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        All financial indicators in the dashboard will be formatted in your chosen currency.
                    </p>
                </div>

                {/* Data Section */}
                <div className="settings-card glass-panel">
                    <h3><Trash2 size={20} /> Data Management</h3>
                    <p className="settings-label" style={{ fontWeight: 'normal' }}>
                        Deleting your chat history is permanent and cannot be undone.
                    </p>
                    <button 
                        className="settings-btn btn-danger" 
                        style={{ marginTop: 'auto' }}
                        onClick={() => setShowModal(true)}
                    >
                        Clear All Conversations
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto' }} />
                        <h3>Clear Chat History?</h3>
                        <p className="text-muted">This will permanently delete all your previous conversations with BizSense AI.</p>
                        <div className="modal-actions">
                            <button className="settings-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="settings-btn btn-danger" onClick={handleClearHistory} style={{ background: '#ef4444', color: 'white' }}>
                                Yes, Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="toast animate-fade-in">
                    <CheckCircle size={18} />
                    <span>{toast}</span>
                </div>
            )}
        </div>
    );
};

export default Settings;
