const express = require('express');
const cors = require('cors');
const app = express();
 
app.use(cors()); // Autorise le cross-origin
app.use(express.json()); // Permet de lire le corps des requêtes JSON
 
let scores = []; // Base de données temporaire (en mémoire)
 
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
 
app.listen(3000, () => console.log("Serveur sur port 3000"));