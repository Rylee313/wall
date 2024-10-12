const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const pigImage = new Image();
pigImage.src = 'https://i.imgur.com/C0QUUdq.png';

const lifeImage = new Image();
lifeImage.src = 'https://i.imgur.com/C9A5LoF.png';

const bombImage = new Image();
bombImage.src = 'https://i.imgur.com/339wcBE.png';

const player = {
    x: 50,
    y: window.innerHeight / 2 - 25,
    width: 50,
    height: 50
};

let obstacles = [];
let movingObstacles = [];
let bombs = [];
const obstacleWidth = 50;
let gameSpeed = 2;
let score = 0;
let combo = 1;
let lives = 9;
let animationFrameId;
let difficultyMultiplier = 1;

window.onload = () => {
    resizeCanvas();
    pigImage.onload = () => {
        document.getElementById('difficulty').style.display = 'block';
    };
};

window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function startGame(speed) {
    gameSpeed = speed;
    document.getElementById('difficulty').style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    if (speed === 6) {
        difficultyMultiplier = 2;
    }
    loop();
}

function createObstacle() {
    const numBlocks = Math.floor(Math.random() * 5) + 3;
    const blockHeight = 20;
    const gap = Math.random() * (canvas.height - 200) + 50;
    
    for (let i = 0; i < numBlocks; i++) {
        obstacles.push({
            x: canvas.width,
            y: gap + i * blockHeight,
            width: obstacleWidth,
            height: blockHeight
        });
    }
}

function createMovingObstacle() {
    const height = 50;
    movingObstacles.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - height),
        width: obstacleWidth,
        height: height,
        direction: Math.random() < 0.5 ? 1 : -1
    });
}

function createBomb() {
    const size = 30;
    bombs.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - size),
        width: size,
        height: size
    });
}

function updateObstacles() {
    obstacles = obstacles.filter(obs => {
        obs.x -= gameSpeed;
        if (checkCollision(player, obs)) {
            score += 10 * combo;
            combo++;
            return false;
        }
        return obs.x + obs.width >= 0;
    });
}

function updateMovingObstacles() {
    movingObstacles = movingObstacles.filter(obs => {
        obs.x -= gameSpeed;
        obs.y += obs.direction * 2;
        if (obs.y <= 0 || obs.y + obs.height >= canvas.height) {
            obs.direction *= -1;
        }
        if (checkCollision(player, obs)) {
            lives--;
            combo = 1;
            if (lives <= 0) {
                endGame();
            }
            return false;
        }
        return obs.x + obs.width >= 0;
    });
}

function updateBombs() {
    bombs = bombs.filter(bomb => {
        bomb.x -= gameSpeed;
        if (checkCollision(player, bomb)) {
            lives--;
            combo = 1;
            if (lives <= 0) {
                endGame();
            }
            return false;
        }
        return bomb.x + bomb.width >= 0;
    });
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function drawPlayer() {
    context.drawImage(pigImage, player.x, player.y, player.width, player.height);
}

function drawObstacles() {
    context.fillStyle = 'gray';
    obstacles.forEach(obs => context.fillRect(obs.x, obs.y, obs.width, obs.height));
}

function drawMovingObstacles() {
    context.fillStyle = 'orange';
    movingObstacles.forEach(obs => context.fillRect(obs.x, obs.y, obs.width, obs.height));
}

function drawBombs() {
    bombs.forEach(bomb => context.drawImage(bombImage, bomb.x, bomb.y, bomb.width, bomb.height));
}

function drawScore() {
    context.fillStyle = 'black';
    context.font = '24px Arial';
    context.fillText('Score: ' + score, 20, 30);
    for (let i = 0; i < lives; i++) {
        context.drawImage(lifeImage, 20 + i * 35, 50, 30, 30);
    }
}

function loop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawObstacles();
    drawMovingObstacles();
    drawBombs();
    drawScore();
    updateObstacles();
    updateMovingObstacles();
    updateBombs();

    if (Math.random() < 0.02 * difficultyMultiplier) {
        createObstacle();
    }

    if (Math.random() < 0.03 * difficultyMultiplier) {
        createMovingObstacle();
    }

    if (Math.random() < 0.01 * difficultyMultiplier) {
        createBomb();
    }

    gameSpeed += 0.002 * difficultyMultiplier;

    animationFrameId = requestAnimationFrame(loop);
}

function endGame() {
    cancelAnimationFrame(animationFrameId);
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').innerText = '最终得分: ' + score;
}

function restartGame() {
    score = 0;
    lives = 9;
    combo = 1;
    obstacles = [];
    movingObstacles = [];
    bombs = [];
    document.getElementById('difficulty').style.display = 'block';
    document.getElementById('restart').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('finalScore').innerText = '';
    canvas.style.display = 'none';
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.width / 2;
    player.y = e.clientY - rect.top - player.height / 2;
});

canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.x = touch.clientX - rect.left - player.width / 2;
    player.y = touch.clientY - rect.top - player.height / 2;
    e.preventDefault();
});