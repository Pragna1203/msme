import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';

function App() {
  const [token, setToken] = useState(localStorage.getItem('msme_token'));
  const [metrics, setMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    localStorage.removeItem('msme_token');
    setToken(null);
  };

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        // Holistic view (both components)
        return (
          <>
            <Dashboard metrics={metrics} />
            <ChatInterface token={token} setMetrics={setMetrics} />
          </>
        );
      case 'assistant':
        // Chatbot exclusively
        return (
          <>
            <div style={{ padding: '0 24px' }}></div>
            <ChatInterface token={token} setMetrics={setMetrics} />
          </>
        );
      case 'analytics':
        // Charts exclusively
        return (
          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
             <Dashboard metrics={metrics} />
             <div className="glass-panel" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Advanced analytics and CSV export available in premium.</p>
             </div>
          </div>
        );
      case 'history':
        return (
          <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '32px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Query History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ padding: '16px', border: '1px solid var(--panel-border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  No previous queries found for this session.
               </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="glass-panel animate-fade-in" style={{ flex: 1, padding: '32px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Preferences</h2>
            <div style={{ padding: '16px', border: '1px solid var(--panel-border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
               Voice Voice Language: English (US) <br/><br/>
               Data Source: ecommerce_sales_data.csv Connected
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </div>
  );
}

export default App;
