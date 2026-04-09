const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'supersecretmsmeagentkey123';

const USERS_FILE = './users.json';
const DB_FILE = path.join(__dirname, 'chat.db');

// Initialize SQLite Database
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // --- Table Initialization ---
        db.serialize(() => {
            // Chat history table
            db.run(`CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                title TEXT,
                messages TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Users table with fullName and settings
            db.run(`CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT,
                fullName TEXT,
                settings TEXT
            )`, () => {
                migrateUsersFromJson();
            });
        });
    }
});

// --- Migration Logic ---
function migrateUsersFromJson() {
    if (fs.existsSync(USERS_FILE)) {
        try {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
            if (users.length > 0) {
                console.log(`Checking migration for ${users.length} users...`);
                users.forEach(user => {
                    const defaultSettings = JSON.stringify({
                        theme: 'dark',
                        font: 'Inter',
                        fontSize: 'medium',
                        currency: 'INR'
                    });
                    db.run(`INSERT OR IGNORE INTO users (username, password, fullName, settings) VALUES (?, ?, ?, ?)`,
                        [user.username, user.password, user.username.split('@')[0], defaultSettings]
                    );
                });
                console.log('Migration check complete.');
            }
        } catch (e) {
            console.error("Migration error:", e.message);
        }
    }
}

// --- Auth Routes ---
app.post('/auth/signup', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultSettings = JSON.stringify({
            theme: 'dark',
            font: 'Inter',
            fontSize: 'medium',
            currency: 'INR'
        });

        db.run(`INSERT INTO users (username, password, fullName, settings) VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, fullName || username.split('@')[0], defaultSettings],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'User already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'User registered successfully' });
            }
        );
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '24h' });
            res.json({ token, message: 'Login successful' });
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- User Settings Routes ---
app.get('/user/settings', authenticateToken, (req, res) => {
    db.get(`SELECT username, fullName, settings FROM users WHERE username = ?`, [req.user.username], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'User not found' });
        
        res.json({
            username: row.username,
            fullName: row.fullName,
            settings: JSON.parse(row.settings || '{}')
        });
    });
});

app.put('/user/settings', authenticateToken, (req, res) => {
    const { fullName, settings } = req.body;
    const settingsJson = JSON.stringify(settings);

    db.run(`UPDATE users SET fullName = ?, settings = ? WHERE username = ?`,
        [fullName, settingsJson, req.user.username],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Settings updated successfully' });
        }
    );
});

// --- Chat Routes ---
app.post('/chat/save', authenticateToken, (req, res) => {
    const { id, title, messages } = req.body;
    const userId = req.user.username;
    const messagesJson = JSON.stringify(messages);

    if (id) {
        db.run(`UPDATE chat_history SET messages = ?, title = ? WHERE id = ? AND user_id = ?`, 
            [messagesJson, title, id, userId], 
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id, message: 'Chat updated' });
            }
        );
    } else {
        db.run(`INSERT INTO chat_history (user_id, title, messages) VALUES (?, ?, ?)`, 
            [userId, title, messagesJson], 
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, message: 'Chat saved' });
            }
        );
    }
});

app.get('/chat/history', authenticateToken, (req, res) => {
    const userId = req.user.username;
    db.all(`SELECT id, title, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at DESC`, 
        [userId], 
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

app.delete('/chat/history', authenticateToken, (req, res) => {
    const userId = req.user.username;
    db.run(`DELETE FROM chat_history WHERE user_id = ?`, [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'History cleared successfully' });
    });
});

app.get('/chat/:id', authenticateToken, (req, res) => {
    const userId = req.user.username;
    const { id } = req.params;
    db.get(`SELECT messages FROM chat_history WHERE id = ? AND user_id = ?`, 
        [id, userId], 
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Chat not found' });
            res.json({ messages: JSON.parse(row.messages) });
        }
    );
});

// --- Query Route ---
app.post('/query', authenticateToken, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const pythonServiceUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000/process_query';
        const response = await fetch(pythonServiceUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            let detail = 'Python Service Error';
            try {
                const errorData = await response.json();
                detail = errorData.detail || detail;
            } catch (e) {}
            throw new Error(detail);
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error proxying to AI service:', err.message);
        res.status(500).json({ error: err.message || 'Error communicating with AI Service.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});

