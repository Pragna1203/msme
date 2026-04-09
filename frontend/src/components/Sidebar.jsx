import React from 'react';
import { LayoutDashboard, MessageSquare, BarChart2, Clock, Settings, LogOut } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onLogout, activeTab, setActiveTab, fullName }) => {
    const handleNav = (e, tab) => {
        e.preventDefault();
        setActiveTab(tab);
    };

    return (
        <div className="sidebar glass-panel">
            <div className="brand">
                <div className="brand-logo">🤖</div>
                <div className="brand-name">BizSense AI</div>
            </div>

            <nav className="nav-menu">
                <div className="nav-section">
                    <span className="nav-title">Menu</span>
                    <a href="#" className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={(e) => handleNav(e, 'overview')}>
                        <LayoutDashboard size={18} /> Dashboard
                    </a>
                    <a href="#" className={`nav-item ${activeTab === 'assistant' ? 'active' : ''}`} onClick={(e) => handleNav(e, 'assistant')}>
                        <MessageSquare size={18} /> AI Assistant
                    </a>
                    <a href="#" className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={(e) => handleNav(e, 'analytics')}>
                        <BarChart2 size={18} /> Analytics
                    </a>
                    <a href="#" className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={(e) => handleNav(e, 'history')}>
                        <Clock size={18} /> History
                    </a>
                    <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => handleNav(e, 'settings')}>
                        <Settings size={18} /> Settings
                    </a>
                </div>

                <div className="nav-section mt-auto">
                    <span className="nav-title">Other</span>
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                        <LogOut size={18} /> Log Out
                    </a>
                </div>
            </nav>

            <div className="user-profile">
                <div className="avatar">{fullName ? fullName.charAt(0).toUpperCase() : 'U'}</div>
                <div className="user-details">
                    <span className="user-name">{fullName || 'User'}</span>
                    <span className="user-plan">Pro Plan</span>
                </div>
            </div>
        </div>
    );
};


export default Sidebar;
