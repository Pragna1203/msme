import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, Paperclip, Send } from 'lucide-react';
import './ChatInterface.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const ChatInterface = ({ token, setMetrics, currentChatId, setCurrentChatId, settings }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const currency = settings?.currency || 'INR';
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Load chat when currentChatId changes
    useEffect(() => {
        if (currentChatId) {
            loadChatHistory(currentChatId);
        } else {
            setMessages([]);
        }
    }, [currentChatId]);

    const loadChatHistory = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/chat/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Failed to load chat", error);
        }
    };

    const saveChat = async (updatedMessages, chatId) => {
        try {
            const body = {
                messages: updatedMessages,
                title: updatedMessages[0]?.content.substring(0, 40) + (updatedMessages[0]?.content.length > 40 ? '...' : '')
            };
            if (chatId) body.id = chatId;

            const response = await fetch('http://localhost:5000/chat/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (response.ok && !chatId) {
                setCurrentChatId(data.id);
            }
        } catch (error) {
            console.error("Failed to save chat", error);
        }
    };

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
        
        console.log(`[Chat] Sending query: ${text.substring(0, 30)}...`);
        const userMessage = { role: 'user', content: text };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query: text, currency })
            });
            
            let data = null;
            try {
                data = await response.json();
            } catch (pErr) {
                console.error("[Chat] Failed to parse JSON response:", pErr);
            }
            
            if (response && response.ok && data) {
                console.log(`[Chat] Received response from AI`);
                const aiMessage = { role: 'ai', content: data.response || "I'm sorry, I couldn't generate a proper response." };
                const finalMessages = [...newMessages, aiMessage];
                setMessages(finalMessages);
                
                // Save to history
                saveChat(finalMessages, currentChatId);

                if (data.logical_metrics) {
                    setMetrics(data.logical_metrics);
                }
            } else {
                const errMsg = data?.error || (response ? `Server returned ${response.status}` : 'Unable to connect to service.');
                console.error(`[Chat] Query failed:`, errMsg);
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    content: `⚠️ Agent Error: ${errMsg}\n\nPlease try again in a moment.` 
                }]);
            }
        } catch (error) {
            console.error(`[Chat] Network error:`, error.message);
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: '❌ Connection failed. Please check if the backend server is running and try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0] || event.dataTransfer?.files?.[0];
        if (!file) return;

        // Validation
        const allowedTypes = [
            'text/csv', 
            'application/vnd.ms-excel', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/pdf',
            'text/plain'
        ];
        
        if (!allowedTypes.includes(file.mimetype) && !file.name.match(/\.(csv|xlsx|xls|pdf|txt)$/i)) {
            alert('Unsupported file type. Please upload CSV, Excel, PDF, or Text files.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Maximum size is 10MB.');
            return;
        }

        console.log(`[Chat] Uploading file: ${file.name}`);
        const userMessage = { role: 'user', content: `📁 Uploaded file: ${file.name}` };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('query', `Analyze this uploaded file (${file.name}) and provide key business insights.`);
        formData.append('currency', currency);

        try {
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            let data = null;
            try {
                data = await response.json();
            } catch (pErr) {
                console.error("[Chat] Failed to parse upload response:", pErr);
            }

            if (response && response.ok && data) {
                console.log(`[Chat] File processed successfully`);
                const aiMessage = { 
                    role: 'ai', 
                    content: data.response || "File uploaded and processed. How can I help you with it?" 
                };
                const finalMessages = [...newMessages, aiMessage];
                setMessages(finalMessages);
                saveChat(finalMessages, currentChatId);
                
                if (data.logical_metrics) {
                    setMetrics(data.logical_metrics);
                }
            } else {
                const errMsg = data?.error || (response ? `Upload failed (${response.status})` : 'Network error during upload');
                console.error(`[Chat] Upload failed:`, errMsg);
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    content: `❌ Upload Error: ${errMsg}` 
                }]);
            }
        } catch (error) {
            console.error(`[Chat] Network error during upload:`, error.message);
            setMessages(prev => [...prev, { 
                role: 'ai', 
                content: '❌ Connection failed during file upload.' 
            }]);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e);
    };

    const handlePredefinedQuery = (query) => {
        handleSend(query);
    };

    return (
        <div 
            className={`chat-interface glass-panel animate-fade-in ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {messages.length === 0 ? (
                <div className="welcome-screen">
                    <div className="floating-avatar">🤖 ✨</div>
                    <h1 className="welcome-title">Welcome to BizSense AI!</h1>
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
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx,.xls,.pdf,.txt"
                />
                <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={20} />
                </button>
                <input 
                    type="text" 
                    className="chat-input"
                    placeholder="Ask AI for BizSense Business Insights..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
                />
                <button className={`send-btn ${input.trim() ? 'active' : ''}`} onClick={() => handleSend(input)}>
                    <Send size={18} />
                </button>
            </div>
            {isDragging && <div className="drag-overlay">Drop files to analyze with BizSense AI</div>}
        </div>
    );
};


export default ChatInterface;
