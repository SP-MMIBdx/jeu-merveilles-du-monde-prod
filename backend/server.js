const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');

// Define file paths
const usersFile = path.join(__dirname, 'data/users.json');
const scoresFile = path.join(__dirname, 'data/scores.json');

// Load or initialize multiplayer queue
const queueFile = path.join(__dirname, 'data/queue.json');

/* -------------------
Queue helpers
------------------- */

function loadQueue() {
    if (!fs.existsSync(queueFile)) return [];
    const data = fs.readFileSync(queueFile, 'utf8');
    return data ? JSON.parse(data) : [];
}

let queue = loadQueue(); // <-- store in-memory queue

function saveQueue(queue) {
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
}


// Define a helper function first

function loadJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8'); // read file
        return data ? JSON.parse(data) : []; // parse JSON or return empty array if file is empty
    } catch (err) {
        return [];
    }
}

// Use the helper function to load variables
let users = loadJSON(usersFile);
let scores = loadJSON(scoresFile);

app.use(cors());
app.use(express.json());


/* -------------------
Routes
------------------- */
// /signup, /signin, /score, /scores routes here

// Save score
app.post('/api/score', (req, res) => {
    const { playerId, points } = req.body;
    // When adding a score
    scores.push({ playerId, points, id: Date.now() });
    fs.writeFileSync(scoresFile, JSON.stringify(scores, null, 2));
    res.status(201).send({ message: "Score enregistré !" });
});

// Test route
app.get('/api/hello', (req, res) => {
    res.json({ message: "Level 1" });
});

// Get leaderboard
app.get('/api/scores', (req, res) => {
    const sorted = [...scores].sort((a, b) => b.points - a.points);
    res.json(sorted);
});

// SIGN UP
app.post('/api/signup', (req, res) => {
    const { login, password } = req.body;

    const existing = users.find(u => u.login === login);
    if (existing) {
        return res.status(400).json({ message: "User already exists" });
    }

    // When adding a user
    users.push({ login, password });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    res.json({ message: "Account created", playerId: login });
});

// SIGN IN
app.post('/api/signin', (req, res) => {
    const { login, password } = req.body;

    const user = users.find(u => u.login === login && u.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login success", playerId: login });
});

// Join multiplayer queue
app.post('/api/join-queue', (req, res) => {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ message: "Missing playerId" });

    // Add player to queue if not already in it
    if (!queue.includes(playerId)) {
        queue.push(playerId);
        saveQueue(queue);
    }

    // If at least 2 players, match the first two
    if (queue.length >= 2) {
        const match = queue.splice(0, 2);
        saveQueue(queue);
        return res.json({ matched: true, players: match });
    }

    // No match yet
    res.json({ matched: false, players: [] });
});

// Check queue status for polling
app.get('/api/queue-status', (req, res) => {
    const { playerId } = req.query;
    if (!playerId) return res.status(400).json({ message: "Missing playerId" });

    // Player is still in queue → waiting
    if (queue.includes(playerId)) {
        return res.json({ matched: false });
    }

    // Player has been matched and removed
    res.json({ matched: true });
});

// Optional: Check current queue (for debugging)
app.get('/api/queue', (req, res) => {
    res.json(queue);
});

app.get('/api/scores/clear', (req, res) => {
    scores.length = 0; // mutate the array instead of reassigning
    fs.writeFileSync(scoresFile, JSON.stringify([]));
    res.json({ message: "Scores cleared" });
});

// DELETE localhost:3000/api/scores/clear

app.get('/api/users/clear', (req, res) => {
    users.length = 0;
    fs.writeFileSync(usersFile, JSON.stringify([]));
    res.json({ message: "Users cleared" });
});

// DELETE localhost:3000/api/users/clear

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
