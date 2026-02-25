import './style.css';
import { setupCounter } from './counter.js';
import Phaser from 'phaser';

// ------------------------
// Global variables
// ------------------------
let player, cursors, ground;

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
    this.physics.add.existing(ground, true); // true = static body

    // 2️⃣ Player (dynamic)
    player = this.add.rectangle(100, 200, 30, 30, 0xff0000);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    // 3️⃣ Collision between player and ground
    this.physics.add.collider(player, ground);

    // 4️⃣ Keyboard input
    cursors = this.input.keyboard.createCursorKeys();
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
