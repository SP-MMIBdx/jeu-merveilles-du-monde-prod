import './style.css';
import { setupCounter } from './counter.js';
import Phaser from 'phaser';

// ------------------------
// Global variables
// ------------------------
let player, cursors, ground;
let score = 0;
let scoreText;
let biscuits;

// ------------------------
// DOM setup (Vite template)
// ------------------------
const app = document.querySelector('#app');

// Title
const title = document.createElement('h1');
title.textContent = "Merveilles du Monde";
app.appendChild(title);

// Counter card
const card = document.createElement('div');
card.classList.add('card');
const btn = document.createElement('button');
btn.id = 'counter';
card.appendChild(btn);
app.appendChild(card);

// Read-me paragraph
const p = document.createElement('p');
p.classList.add('read-the-docs');
p.textContent = "";
app.appendChild(p);

// Setup Vite counter
setupCounter(btn);
// ------------------------
// Phaser scene functions
// ------------------------
function preload() {
    // No assets yet
}

function create() {
    console.log("Phaser create called");

    // 1️⃣ Ground (static)
    ground = this.add.rectangle(400, 380, 800, 40, 0x666666);
    this.physics.add.existing(ground, true);

    // 2️⃣ Player (dynamic)
    player = this.add.rectangle(100, 200, 30, 30, 0xff0000);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    // 3️⃣ Player ↔ ground collision
    this.physics.add.collider(player, ground);

    // 4️⃣ Keyboard input
    cursors = this.input.keyboard.createCursorKeys();

    // 5️⃣ Create biscuits group FIRST
    biscuits = this.physics.add.group();

    // 6️⃣ NOW add biscuits ↔ ground collision
    this.physics.add.collider(biscuits, ground);

    // 7️⃣ Create a biscuit
    const biscuit = this.add.rectangle(400, 0, 20, 20, 0xffff00);
    this.physics.add.existing(biscuit);
    biscuits.add(biscuit);

    // 8️⃣ Player ↔ biscuits overlap
    this.physics.add.overlap(player, biscuits, collectBiscuit, null, this);

    fetch('http://localhost:3000/api/hello')
        .then(res => res.json())
        .then(data => {
            console.log("Server says:", data.message);
            // Display in-game
            this.add.text(20, 20, data.message, { fontSize: '20px', color: '#ffffff' });
        });
    scoreText = this.add.text(20, 50, "Biscuits: 0", {
        fontSize: '20px',
        color: '#ffffff'
    });

    // Press SPACE to end the round and send score
    this.input.keyboard.on('keydown-SPACE', () => {
        const pseudo = "Player1"; // For testing
        console.log("Round ended. Score:", score);
        sendScore(pseudo, score).then(() => fetchLeaderboard.call(this));

    });

}

function update() {
    // Horizontal movement
    if (cursors.left.isDown) {
        player.body.setVelocityX(-160);
    } else if (cursors.right.isDown) {
        player.body.setVelocityX(160);
    } else {
        player.body.setVelocityX(0);
    }

    // Jumping (only if touching the ground)
    if (cursors.up.isDown && player.body.touching.down) {
        player.body.setVelocityY(-350);
    }
}

function collectBiscuit(player, biscuit) {
    biscuit.destroy();

    score += 1;
    scoreText.setText("Biscuits: " + score);
}

// Fonction pour envoyer le score à la fin de la partie
async function sendScore(nom, scoreFinal) {
    const data = { pseudo: nom, points: scoreFinal };

    const response = await fetch('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const resultat = await response.json();
    console.log(resultat.message);
}

async function fetchLeaderboard() {
    const response = await fetch('http://localhost:3000/api/scores');
    const leaderboard = await response.json();
    console.log("Leaderboard:", leaderboard);

    // Display leaderboard on Phaser canvas
    let y = 50;
    leaderboard.forEach(entry => {
        this.add.text(600, y, `${entry.pseudo}: ${entry.points}`, { fontSize: '16px', color: '#ffffff' });
        y += 20;
    });
}

// ------------------------
// Phaser game config
// ------------------------
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 600 } }
    },
    scene: { preload, create, update },
    parent: 'app' // Phaser canvas will be added inside #app
};

// ------------------------
// Start Phaser
// ------------------------
const game = new Phaser.Game(config);
