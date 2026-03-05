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

/*const btn = document.createElement('button');
btn.id = 'counter';
card.appendChild(btn);
app.appendChild(card);

setupCounter(btn);*/

/* -----------------------
Phaser Scene
----------------------- */

function preload() {
    this.load.image('bg', 'assets/img/Background.png');
    this.load.image('biscuit', 'assets/img/biscuit.png');

    // Lion frames
    for (let i = 1; i <= 5; i++) {
        this.load.image(`LionRight${i}`, `assets/img/LionRight${i}.png`);
        this.load.image(`LionLeft${i}`, `assets/img/LionLeft${i}.png`);
    }

    //Rat frames

    for (let i = 1; i <= 2; i++) {
    this.load.image(`RatRight${i}`, `assets/img/RatRight${i}.png`);
    this.load.image(`RatLeft${i}`, `assets/img/RatLeft${i}.png`);
}
}

function create() {

    console.log("Phaser create called");

    // Game not started until player logs in and chooses mode
    this.gameStarted = false;

    // Set world bounds larger than the viewport for horizontal scrolling
    const worldWidth = 5000;

    // Background
    const bgTexture = this.textures.get('bg').getSourceImage();

    // Add image at top-left
    this.background = this.add.image(0, 0, 'bg')
        .setOrigin(0, 0)
        .setScrollFactor(1); // background scrolls with camera

    // Scale vertically to fill viewport
    this.background.displayHeight = this.scale.height;
    this.background.scaleX = this.background.scaleY; // maintain aspect ratio
    // Set world bounds for physics and camera
    this.physics.world.setBounds(0, 0, worldWidth, 400);
    this.cameras.main.setBounds(0, 0, worldWidth, 400);


    /* STATE */
    this.roundEnded = false;
    this.score = 0;
    this.remainingTime = 120; // 120 seconds per round

    /* INPUT */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    // UI Container:
    this.hud = this.add.container(20, 20); // top-left corner
    this.hud.setScrollFactor(0); // UI should not scroll with the world

    // Create texts
    this.levelText = this.add.text(0, 0, "Level ?", { fontSize: '20px', color: '#000000' });
    this.scoreText = this.add.text(0, 0, "Biscuits: 0", { fontSize: '20px', color: '#000000' });
    this.timerText = this.add.text(0, 0, "Time:", { fontSize: '20px', color: '#000000' });

    // Add texts to HUD container
    [this.levelText, this.scoreText, this.timerText].forEach(txt => this.hud.add(txt));

    // After levelText, scoreText, timerText
    this.runningScoreText = this.add.text(0, 0, "Score: 0", { fontSize: '20px', color: '#000000' });
    this.hud.add(this.runningScoreText);

    // Stack them vertically
    let offsetY = 0;
    [this.levelText, this.scoreText, this.timerText, this.runningScoreText].forEach(txt => {
        txt.setY(offsetY);
        offsetY += parseInt(txt.style.fontSize, 10) + 5; // spacing
    });

    this.hud.add(this.timerText);
    /* WORLD */

    // Ground (invisible, for collisions)
    this.ground = this.add.rectangle(worldWidth / 2, 380, worldWidth, 105, 0x666666);
    this.physics.add.existing(this.ground, true);
    this.ground.setVisible(false);

    /* PLAYER/LION */
    this.player = this.physics.add.sprite(100, 200, 'LionRight1');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(0.2); // lion sizing

    // Shrink hitbox
this.player.body.setSize(
    this.player.width * 0.5,
    this.player.height * 0.35,
);

// Move hitbox down so feet touch ground
this.player.body.setOffset(
    this.player.width * 0.25,
    this.player.height * 0.4
);

    // Create animations (using static images for simplicity)
    this.anims.create({
        key: 'run_left',
        frames: [
            { key: 'LionLeft1' },
            { key: 'LionLeft2' },
            { key: 'LionLeft3' },
            { key: 'LionLeft4' },
            { key: 'LionLeft5' }
        ],
        frameRate: 8,
        repeat: -1
    });

    this.anims.create({
        key: 'run_right',
        frames: [
            { key: 'LionRight1' },
            { key: 'LionRight2' },
            { key: 'LionRight3' },
            { key: 'LionRight4' },
            { key: 'LionRight5' }
        ],
        frameRate: 8,
        repeat: -1
    });
    
    // Rat animations

    this.anims.create({
    key: 'rat_right',
    frames: [
        { key: 'RatRight1' },
        { key: 'RatRight2' }
    ],
    frameRate: 4,
    repeat: -1
});

this.anims.create({
    key: 'rat_left',
    frames: [
        { key: 'RatLeft1' },
        { key: 'RatLeft2' }
    ],
    frameRate: 4,
    repeat: -1
});

    // Camera follows player
    this.cameras.main.startFollow(this.player);

    // Collisions with ground
    this.physics.add.collider(this.player, this.ground);

    /* BISCUITS */
    this.biscuits = this.physics.add.group();

    // Fill level with biscuits up to the finish line
    const biscuitSpacingX = 200; // horizontal spacing
    const biscuitSize = 35;      // visual size of biscuits

    for (let x = 100; x < worldWidth - 50; x += biscuitSpacingX) {
        const y = Phaser.Math.Between(50, 150); // spawn above ground

        // Create physics-enabled sprite directly
        const biscuit = this.physics.add.sprite(x, y, 'biscuit');

        // Resize to match desired size
        const scaleX = biscuitSize / biscuit.width;
        const scaleY = biscuitSize / biscuit.height;
        biscuit.setScale(scaleX, scaleY);

        // Make it affected by gravity
        biscuit.body.setAllowGravity(true);
        biscuit.body.setImmovable(false);

        // Add to group
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

    /* FINISH LINE */
    const finish = this.add.rectangle(worldWidth - 50, 250, 20, 200, 0x00ff00); // invisible finish line
    this.physics.add.existing(finish, true);
    this.finish = finish; // store reference for later use
    this.finish.setVisible(true); // make finish visible for testing

    this.physics.add.overlap(
        this.player,
        finish,
        () => endRound.call(this),
        null,
        this
    );

    /* ROUND END UI */

    this.roundEndUI = this.add.container(400, 200).setVisible(false); // center of screen
    this.roundEndUI.setScrollFactor(0); // Fix to camera

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

    /* PLAYER INPUT (START SCREEN) */

    showLogin(async (playerId) => {
        this.playerId = playerId;

        // Show singleplayer vs multiplayer choice overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '1000';

        const title = document.createElement('h2');
        title.textContent = 'Choose Mode';
        title.style.color = '#fff';
        title.style.marginBottom = '20px';
        overlay.appendChild(title);

        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '20px';
        overlay.appendChild(btnContainer);

        const spBtn = document.createElement('button');
        spBtn.textContent = 'Singleplayer';
        btnContainer.appendChild(spBtn);

        const mpBtn = document.createElement('button');
        mpBtn.textContent = 'Multiplayer';
        btnContainer.appendChild(mpBtn);

        document.body.appendChild(overlay);

        // Button actions
        spBtn.addEventListener('click', () => {
            overlay.remove();
            startGame.call(this);
        });

        mpBtn.addEventListener('click', async () => {
            overlay.remove();

            try {
                await enterMultiplayerQueue.call(this);
                console.log("Starting multiplayer game");
                startGame.call(this); // starts timer and allows update loop
            } catch (err) {
                console.error("Error entering queue:", err);
            }
        });

    });

}

function update() {

    if (!this.gameStarted) return;

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        if (this.roundEnded) {
            this.scene.restart();
            return;
        }
        endRound.call(this);
    }

    if (this.roundEnded) return;

    if (this.cursors.left.isDown) {

        this.player.setVelocityX(-160);

        if (this.player.body.touching.down) {
            this.player.anims.play('run_left', true);
        }

    }
    else if (this.cursors.right.isDown) {

        this.player.setVelocityX(160);

        if (this.player.body.touching.down) {
            this.player.anims.play('run_right', true);
        }

    }
    else {

        this.player.setVelocityX(0);

        if (this.player.body.touching.down) {
            this.player.anims.stop();
        }
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
        this.player.body.setVelocityY(-350);
    }

    this.biscuits.getChildren().forEach(b => {
        if (b.updateSprite) b.updateSprite();
    });
}



/* -----------------------
GAME LOGIC
----------------------- */

function collectBiscuit(player, biscuit) {
    // Destroy the biscuit sprite (physics body included)
    biscuit.destroy();

    // Update score
    this.score++;
    this.scoreText.setText("Biscuits: " + this.score);
    updateRunningScore.call(this);
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
        await sendScore(this.playerId, finalScore);
        leaderboard = await fetchLeaderboard();
    } catch (err) {
        console.error("Leaderboard error:", err);
    }

    /* DISPLAY UI */
    this.roundEndScoreText.setText("Final Score: " + finalScore);

    let text = leaderboard.length ? "" : "No leaderboard data";
    leaderboard.slice(0, 5).forEach((entry, i) => {
        // entry.pseudo now contains the logged-in username
        text += `${i + 1}. ${entry.playerId} - ${entry.points}\n`;
    });

    this.roundEndLeaderboardText.setText(text);

    this.roundEndLeaderboardText.setText(text);
    this.roundEndUI.setVisible(true);
}

function updateRunningScore() {
    const multiplier = 10; // points per biscuit
    const timeFactor = 5;  // points per remaining second
    const runningScore = Math.floor(this.score * multiplier + this.remainingTime * timeFactor);
    this.runningScoreText.setText("Score: " + runningScore);
}

async function fetchLeaderboard() {
    const response = await fetch('http://localhost:3000/api/scores');
    return await response.json();
}

async function sendScore(playerId, score) {
    await fetch('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            playerId, // <- use playerId from login
            points: score
        })
    });
}

function showLogin(onLogin) {
    // Overlay container
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Login or Sign Up';
    title.style.color = '#fff';
    title.style.marginBottom = '20px';
    overlay.appendChild(title);

    // Login input
    const loginInput = document.createElement('input');
    loginInput.type = 'text';
    loginInput.placeholder = 'Username';
    loginInput.style.padding = '8px';
    loginInput.style.marginBottom = '10px';
    overlay.appendChild(loginInput);

    // Password input
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password';
    passwordInput.style.padding = '8px';
    passwordInput.style.marginBottom = '10px';
    overlay.appendChild(passwordInput);

    // Status message
    const status = document.createElement('div');
    status.style.color = 'yellow';
    status.style.marginBottom = '10px';
    overlay.appendChild(status);

    // Buttons container
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    overlay.appendChild(btnContainer);

    // Sign in button
    const signInBtn = document.createElement('button');
    signInBtn.textContent = 'Sign In';
    btnContainer.appendChild(signInBtn);

    // Sign up button
    const signUpBtn = document.createElement('button');
    signUpBtn.textContent = 'Sign Up';
    btnContainer.appendChild(signUpBtn);

    document.body.appendChild(overlay);

    // Helper function for fetch
    const postData = async (url, payload) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Server error');
        return data;
    };

    // Sign In
    signInBtn.addEventListener('click', async () => {
        const login = loginInput.value.trim();
        const password = passwordInput.value.trim();
        if (!login || !password) {
            status.textContent = 'Please enter username and password';
            return;
        }

        try {
            const data = await postData('http://localhost:3000/api/signin', { login, password });
            overlay.remove();
            onLogin(data.playerId); // resume Phaser game
        } catch (err) {
            status.textContent = err.message;
        }
    });

    // Sign Up
    signUpBtn.addEventListener('click', async () => {
        const login = loginInput.value.trim();
        const password = passwordInput.value.trim();
        if (!login || !password) {
            status.textContent = 'Please enter username and password';
            return;
        }

        try {
            const data = await postData('http://localhost:3000/api/signup', { login, password });
            overlay.remove();
            onLogin(data.playerId); // resume Phaser game
        } catch (err) {
            status.textContent = err.message;
        }
    });
}

async function enterMultiplayerQueue() {
    return new Promise(async (resolve, reject) => {
        let waitMsg;

        try {
            // Create waiting message overlay
            waitMsg = document.createElement('div');
            waitMsg.textContent = "Waiting for another player...";
            waitMsg.style.position = 'absolute';
            waitMsg.style.top = '50%';
            waitMsg.style.left = '50%';
            waitMsg.style.transform = 'translate(-50%, -50%)';
            waitMsg.style.color = "#fff";
            waitMsg.style.fontSize = "24px";
            waitMsg.style.background = "rgba(0,0,0,0.7)";
            waitMsg.style.padding = "20px";
            waitMsg.style.borderRadius = "10px";
            waitMsg.style.zIndex = "1000";
            document.body.appendChild(waitMsg);

            // join queue
            const response = await fetch('http://localhost:3000/api/join-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: this.playerId })
            });
            const data = await response.json();

            if (data.matched) {
                console.log("Match found immediately with:", data.players);
                waitMsg.remove();
                resolve(); // start the game
            } else {
                console.log("Waiting for another player...");
                const pollInterval = setInterval(async () => {
                    try {
                        const res = await fetch(`http://localhost:3000/api/queue-status?playerId=${this.playerId}`);
                        const status = await res.json();
                        if (status.matched) {
                            console.log("Match found via polling");
                            clearInterval(pollInterval);
                            waitMsg.remove(); // remove overlay
                            resolve(); // start the game
                        }
                    } catch (err) {
                        clearInterval(pollInterval);
                        waitMsg.remove();
                        reject(err);
                    }
                }, 2000);
            }
        } catch (err) {
            if (waitMsg) waitMsg.remove();
            reject(err);
        }
    });
}
/* -----------------------
Start game function (called after mode selection)
----------------------- */

function startGame() {
    this.gameStarted = true;

    this.timerEvent = this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            if (this.roundEnded) return;

            this.remainingTime--;
            this.timerText.setText("Time: " + this.remainingTime);

            updateRunningScore.call(this);

            if (this.remainingTime <= 0) {
                endRound.call(this);
            }
        }
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
        arcade: {
            gravity: { y: 600 },
            debug: true
        }
    },
    scene: { preload, create, update },
    parent: 'app'
};

const game = new Phaser.Game(config); // 1. create game first
