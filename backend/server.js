const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'data/users.json');
const scoresFile = path.join(__dirname, 'data/scores.json');

let users = JSON.parse(fs.readFileSync(usersFile, 'utf8') || '[]');
let scores = JSON.parse(fs.readFileSync(scoresFile, 'utf8') || '[]');

app.use(cors());
app.use(express.json());

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


app.listen(3000, () => console.log("Serveur sur port 3000"));
