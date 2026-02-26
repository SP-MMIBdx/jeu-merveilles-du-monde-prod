import './style.css';
import { setupCounter } from './counter.js';
import Phaser from 'phaser';

/* -----------------------
   DOM (Vite template)
----------------------- */

const app = document.querySelector('#app');

const title = document.createElement('h1');
title.textContent = "Merveilles du Monde";
app.appendChild(title);

const card = document.createElement('div');
card.classList.add('card');

const btn = document.createElement('button');
btn.id = 'counter';
card.appendChild(btn);
app.appendChild(card);

setupCounter(btn);

/* -----------------------
   Phaser Scene
----------------------- */

function preload() { }

function create() {

    console.log("Phaser create called");

    /* STATE */
    this.roundEnded = false;
    this.score = 0;
    this.remainingTime = 30;

    /* INPUT */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

// UI Container:
this.hud = this.add.container(20, 20); // top-left corner

// Create texts
this.levelText = this.add.text(0, 0, "Level ?", { fontSize: '20px', color: '#ffffff' });
this.scoreText = this.add.text(0, 0, "Score: 0", { fontSize: '20px', color: '#ffffff' });
this.timerText = this.add.text(0, 0, "Time: 0", { fontSize: '20px', color: '#ffffff' });

// Add texts to HUD container
[this.levelText, this.scoreText, this.timerText].forEach(txt => this.hud.add(txt));

// Use offsetY to stack them automatically
let offsetY = 0;
[this.levelText, this.scoreText, this.timerText].forEach(txt => {
    txt.setY(offsetY);
    offsetY += parseInt(txt.style.fontSize, 10) + 5; // 5px padding between lines
});

    this.hud.add(this.timerText);
    /* WORLD */
    this.ground = this.add.rectangle(400, 380, 800, 40, 0x666666);
    this.physics.add.existing(this.ground, true);

    this.player = this.add.rectangle(100, 200, 30, 30, 0xff0000);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.ground);

    /* BISCUITS */
    this.biscuits = this.physics.add.group();

    // Spawn 5 biscuits at random x positions
    for (let i = 0; i < 5; i++) {
        const biscuit = this.add.rectangle(
            Phaser.Math.Between(50, 750), // random x
            Phaser.Math.Between(0, 50),   // random y near top
            20, 20,
            0xffff00
        );

        this.physics.add.existing(biscuit);
        this.biscuits.add(biscuit);
    }

    // Collisions with ground
    this.physics.add.collider(this.biscuits, this.ground);

    // Player overlaps biscuits
    this.physics.add.overlap(
        this.player,
        this.biscuits,
        collectBiscuit,
        null,
        this
    );

    /* FINISH */
    const finish = this.add.rectangle(750, 350, 20, 80, 0x00ff00);
    this.physics.add.existing(finish, true);

    this.physics.add.overlap(
        this.player,
        finish,
        () => endRound.call(this),
        null,
        this
    );

    /* TIMER */
    this.timerEvent = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            if (this.roundEnded) return;

            this.remainingTime--;
            this.timerText.setText("Time: " + this.remainingTime);

            if (this.remainingTime <= 0) {
                endRound.call(this);
            }
        }
    });

    /* ROUND END UI */

    this.roundEndUI = this.add.container(400, 200).setVisible(false);

    const panel = this.add.rectangle(0, 0, 300, 180, 0x222222, 0.9);
    this.roundEndUI.add(panel);

    this.roundEndScoreText = this.add.text(0, -40, "", {
        fontSize: '22px',
        color: '#ffffff'
    }).setOrigin(0.5);

    this.roundEndLeaderboardText = this.add.text(0, 10, "", {
        fontSize: '16px',
        color: '#ffffaa',
        align: 'center'
    }).setOrigin(0.5);

    this.roundEndRestartText = this.add.text(0, 60, "Press SPACE to restart", {
        fontSize: '14px',
        color: '#ffffff'
    }).setOrigin(0.5);

    this.roundEndUI.add(this.roundEndScoreText);
    this.roundEndUI.add(this.roundEndLeaderboardText);
    this.roundEndUI.add(this.roundEndRestartText);

    /* BACKEND TEST (THIS MUST BE INSIDE CREATE) */
    fetch('http://localhost:3000/api/hello')
        .then(res => res.json())
        .then(data => {
            // Example: data.message = "Level 1"
            this.levelText.setText(data.message);
        })
        .catch(err => console.error("Could not fetch level:", err));
}

function update() {

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        if (this.roundEnded) {
            this.scene.restart();
            return;
        }
        endRound.call(this);
    }

    if (this.roundEnded) return;

    if (this.cursors.left.isDown) {
        this.player.body.setVelocityX(-160);
    }
    else if (this.cursors.right.isDown) {
        this.player.body.setVelocityX(160);
    }
    else {
        this.player.body.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
        this.player.body.setVelocityY(-350);
    }
}

/* -----------------------
   GAME LOGIC
----------------------- */

function collectBiscuit(player, biscuit) {
    biscuit.destroy();
    this.score++;
    this.scoreText.setText("Score: " + this.score);
}

async function endRound() {

    if (this.roundEnded) return;
    this.roundEnded = true;

    this.timerEvent.remove();

    const multiplier = 10; // points per biscuit
    const timeFactor = 5;  // points per remaining second

// Final score
const finalScore = Math.floor(this.score * multiplier + this.remainingTime * timeFactor);

    console.log("Final score:", finalScore);

    this.player.body.setVelocity(0, 0);
    this.player.body.allowGravity = false;

    let leaderboard = [];

    try {
        await sendScore("Player1", finalScore);
        leaderboard = await fetchLeaderboard();
    } catch (err) {
        console.error("Leaderboard error:", err);
    }

    /* DISPLAY UI */
    this.roundEndScoreText.setText("Final Score: " + finalScore);

    let text = leaderboard.length ? "" : "No leaderboard data";
    leaderboard.slice(0, 5).forEach((entry, i) => {
        text += `${i + 1}. ${entry.pseudo} - ${entry.points}\n`;
    });

    this.roundEndLeaderboardText.setText(text);
    this.roundEndUI.setVisible(true);
}

async function fetchLeaderboard() {
    const response = await fetch('http://localhost:3000/api/scores');
    return await response.json();
}

async function sendScore(pseudo, score) {
    await fetch('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            pseudo: pseudo,
            points: score
        })
    });
}

/* -----------------------
   CONFIG
----------------------- */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 600 } }
    },
    scene: { preload, create, update },
    parent: 'app'
};

new Phaser.Game(config);
