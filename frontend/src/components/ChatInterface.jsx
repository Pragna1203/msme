import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, Paperclip, Send } from 'lucide-react';
import './ChatInterface.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const ChatInterface = ({ token, setMetrics }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        if (recognition) {
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) return alert('Speech recognition not supported in this browser.');
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    const handleSend = async (text) => {
        if (!text.trim()) return;
        
        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: text })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
                if (data.logical_metrics) {
                    setMetrics(data.logical_metrics);
                }
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error || 'Server error'}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Connection failed.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePredefinedQuery = (query) => {
        handleSend(query);
    };

    return (
        <div className="chat-interface glass-panel animate-fade-in">
            {messages.length === 0 ? (
                <div className="welcome-screen">
                    <div className="floating-avatar">🤖 ✨</div>
                    <h1 className="welcome-title">Welcome to MSME Agent!</h1>
                    <p className="welcome-subtitle">How can I help you grow today?</p>
                    
                    <div className="suggested-prompts">
                        <button className="prompt-pill" onClick={() => handlePredefinedQuery('Analyze my profit margins')}>Analyze profit</button>
                        <button className="prompt-pill" onClick={() => handlePredefinedQuery('What is the recent sales trend?')}>Summarize trend</button>
                        <button className="prompt-pill" onClick={() => handlePredefinedQuery('Compare monthly performance')}>Compare performance</button>
                    </div>
                </div>
            ) : (
                <div className="chat-history">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                            {msg.role === 'ai' && <div className="msg-avatar">🤖</div>}
                            <div className="message-content">
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message message-ai">
                            <div className="msg-avatar">🤖</div>
                            <div className="message-content loading-dots">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
            
            <div className="chat-input-container">
                <button className="icon-btn" onClick={toggleListening} style={{ color: isListening ? 'var(--accent)' : '' }}>
                    <Mic size={20} />
                </button>
                <button className="icon-btn">
                    <Paperclip size={20} />
                </button>
                <input 
                    type="text" 
                    className="chat-input"
                    placeholder="Ask AI for MSME Business Insights..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
                />
                <button className={`send-btn ${input.trim() ? 'active' : ''}`} onClick={() => handleSend(input)}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
