const express = require('express');
const cors = require('cors');
const app = express();
 
app.use(cors()); // Autorise le cross-origin
app.use(express.json()); // Permet de lire le corps des requêtes JSON
 
let scores = []; // Base de données temporaire (en mémoire)
let users = [];        // login system
let fighterQueue = []; // players waiting for match
let fightScores = [];  // multiplayer match results
 
app.post('/api/score', (req, res) => {
    const { pseudo, points } = req.body;
    scores.push({ pseudo, points, id: Date.now() });
    res.status(201).send({ message: "Score enregistré !" });
});

// Test GET route
app.get('/api/hello', (req, res) => {
    res.json({ message: "Level 1" });
});

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

    users.push({ login, password });

    res.json({ message: "Account created" });
});

// SIGN IN
app.post('/api/signin', (req, res) => {
    const { login, password } = req.body;

    const user = users.find(
        u => u.login === login && u.password === password
    );

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
        message: "Login success",
        playerId: login
    });
});

 
app.listen(3000, () => console.log("Serveur sur port 3000"));