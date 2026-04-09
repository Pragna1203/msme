import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';

function App() {
  const [token, setToken] = useState(localStorage.getItem('msme_token'));
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentChatId, setCurrentChatId] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Settings & Profile State
  const [fullName, setFullName] = useState('Business User');
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('msme_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      font: 'Inter',
      fontSize: 'medium',
      currency: 'INR'
    };
  });

  const handleLogout = () => {
    localStorage.removeItem('msme_token');
    localStorage.removeItem('msme_settings');
    setToken(null);
  };

  // Sync Settings to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.className = `theme-${settings.theme} font-${settings.font.toLowerCase()} size-${settings.fontSize}`;
    localStorage.setItem('msme_settings', JSON.stringify(settings));
  }, [settings]);

  // Fetch History & Settings on Load
  useEffect(() => {
    if (token) {
      fetchUserSettings();
      if (activeTab === 'history') fetchHistory();
    }
  }, [token, activeTab]);

  const fetchUserSettings = async () => {
    try {
      const res = await fetch('http://localhost:5000/user/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFullName(data.fullName);
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const updateUserSettings = async (newName, newSettings) => {
    try {
      const res = await fetch('http://localhost:5000/user/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ fullName: newName, settings: newSettings })
      });
      if (res.ok) {
        setFullName(newName);
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update settings", err);
      return false;
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/chat/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const loadChat = (id) => {
    setCurrentChatId(id);
    setActiveTab('assistant');
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setActiveTab('assistant');
  };

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <Dashboard metrics={metrics} settings={settings} />
            <ChatInterface token={token} setMetrics={setMetrics} currentChatId={currentChatId} setCurrentChatId={setCurrentChatId} />
          </>
        );
      case 'assistant':
        return (
          <>
            <div style={{ padding: '0 24px' }}></div>
            <ChatInterface token={token} setMetrics={setMetrics} currentChatId={currentChatId} setCurrentChatId={setCurrentChatId} />
          </>
        );
      case 'analytics':
        return <Dashboard metrics={metrics} settings={settings} />;
      case 'history':
        return (
          <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px' }}>Chat History</h2>
              <button className="export-btn export-btn--csv" onClick={startNewChat}>+ New Chat</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
               {history.length > 0 ? history.map(item => (
                 <div key={item.id} className="chart-card" style={{ cursor: 'pointer' }} onClick={() => loadChat(item.id)}>
                    <div className="chart-card__header">
                      <span className="chart-card__title" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title || 'Untitled Chat'}
                      </span>
                      <span className="chart-card__badge" style={{ fontSize: '10px' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Click to continue this conversation...
                    </div>
                 </div>
               )) : (
                 <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No conversations found. Start a new chat with BizSense AI!
                 </div>
               )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <Settings 
            token={token}
            fullName={fullName} 
            settings={settings} 
            updateUserSettings={updateUserSettings}
            setHistory={setHistory}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        fullName={fullName}
      />
      {renderContent()}
    </div>
  );
}

export default App;

