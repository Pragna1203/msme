const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'supersecretmsmeagentkey123';

const USERS_FILE = './users.json';

// Initialize users file if not exists
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Helper to get users
function getUsers() {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Helper to save users
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// --- Auth Routes ---
app.post('/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const users = getUsers();
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });
        saveUsers(users);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = getUsers();
        const user = users.find(u => u.username === username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '24h' });
        res.json({ token, message: 'Login successful' });
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

// --- Query Route ---
// Protect this route and proxy to Python API
app.post('/query', authenticateToken, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Send to python API
        const pythonServiceUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000/process_query';
        const response = await fetch(pythonServiceUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
