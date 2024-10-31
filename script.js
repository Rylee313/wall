const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreElement = document.getElementById('finalScore');
const loadingMessage = document.getElementById('loadingMessage');

// 游戏核心变量
let gameLoop;
let lastTime = 0;
let piggy;
let walls = [];
let staticObstacles = [];
let movingObstacles = [];
let giantObstacles = [];
let score = 0;
let lives = 9;
let gameSpeed = 1;
let gameTime = 0;
let isGamePaused = false;

// 游戏配置
const GAME_CONFIG = {
    PIGGY_SIZE: 50,
    WALL_WIDTH: 20,
    STATIC_OBSTACLE_SIZE: 40,
    MOVING_OBSTACLE_SIZE: 40,
    GIANT_OBSTACLE_SIZE: 120,
    INVULNERABLE_TIME: 1000,
    SCORE_INCREMENT: 100,
    SPEED_INCREMENT: 0.0001,
    SPAWN_RATES: {
        WALL: 0.03,
        STATIC: 0.02,
        MOVING: 0.01,
        GIANT: 0.002
    }
};

// 图片资源管理
const IMAGES = {
    piggy: { src: 'https://i.imgur.com/C0QUUdq.png' },
    life: { src: 'https://i.imgur.com/C9A5LoF.png' },
    staticObstacle: { src: 'https://i.imgur.com/339wcBE.png' },
    movingObstacle: { src: 'https://i.imgur.com/UaSzf5z.png' },
    giantObstacle: { src: 'https://i.imgur.com/339wcBE.png' }
};

// 加载图片
const loadedImages = {};
let imagesLoaded = 0;
const totalImages = Object.keys(IMAGES).length;

function loadImages() {
    Object.entries(IMAGES).forEach(([key, value]) => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            updateLoadingProgress();
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${value.src}`);
            imagesLoaded++;
            updateLoadingProgress();
        };
        img.src = value.src;
        loadedImages[key] = img;
    });
}

function updateLoadingProgress() {
    loadingMessage.textContent = `加载中... (${imagesLoaded}/${totalImages})`;
    if (imagesLoaded === totalImages) {
        startButton.disabled = false;
        startButton.textContent = '开始游戏';
        loadingMessage.style.display = 'none';
    }
}

// 游戏对象类
class GameObject {
    constructor(x, y, width, height, speed = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
    }

    draw(image) {
        if (image) {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
        }
    }

    update(deltaTime) {
        // 基础更新逻辑
    }

    isOffscreen() {
        return this.x + this.width < 0;
    }
}

class Piggy extends GameObject {
    constructor() {
        super(
            50,
            canvas.height / 2 - GAME_CONFIG.PIGGY_SIZE / 2,
            GAME_CONFIG.PIGGY_SIZE,
            GAME_CONFIG.PIGGY_SIZE
        );
        this.isInvulnerable = false;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    draw() {
        if (this.isInvulnerable) {
            ctx.globalAlpha = 0.5;
        }
        super.draw(loadedImages.piggy);
        ctx.globalAlpha = 1.0;
    }

    moveTo(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    update(deltaTime) {
        const lerp = 0.1;
        this.x += (this.targetX - this.x) * lerp;
        this.y += (this.targetY - this.y) * lerp;

        // 确保piggy不会超出画布边界
        this.x = Math.max(0, Math.min(this.x, canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, canvas.height - this.height));
    }
}

// 游戏主循环
function gameLoop(timestamp) {
    if (isGamePaused) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    updateGame(deltaTime);
    drawGame();

    requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    gameTime += deltaTime;
    gameSpeed += GAME_CONFIG.SPEED_INCREMENT * deltaTime;

    // 更新所有游戏对象
    piggy.update(deltaTime);
    updateObstacles(deltaTime);
    checkCollisions();
    spawnObstacles();
}

function checkCollisions() {
    const allObstacles = [...walls, ...staticObstacles, ...movingObstacles, ...giantObstacles];
    
    for (const obstacle of allObstacles) {
        if (detectCollision(piggy, obstacle)) {
            handleCollision(obstacle);
        }
    }
}

function detectCollision(obj1, obj2) {
    const tolerance = 5;
    return (
        obj1.x + tolerance < obj2.x + obj2.width &&
        obj1.x + obj1.width - tolerance > obj2.x &&
        obj1.y + tolerance < obj2.y + obj2.height &&
        obj1.y + obj1.height - tolerance > obj2.y
    );
}

function handleCollision(obstacle) {
    if (piggy.isInvulnerable) return;

    if (obstacle instanceof Wall) {
        score += GAME_CONFIG.SCORE_INCREMENT;
    } else {
        lives--;
        if (lives <= 0) {
            endGame();
            return;
        }
        piggy.isInvulnerable = true;
        setTimeout(() => {
            piggy.isInvulnerable = false;
        }, GAME_CONFIG.INVULNERABLE_TIME);
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制所有游戏对象
    piggy.draw();
    walls.forEach(wall => wall.draw());
    staticObstacles.forEach(obstacle => obstacle.draw());
    movingObstacles.forEach(obstacle => obstacle.draw());
    giantObstacles.forEach(obstacle => obstacle.draw());

    // 绘制UI
    drawUI();
}

function drawUI() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`得分: ${score}`, 10, 30);
    ctx.fillText(`速度: ${gameSpeed.toFixed(2)}x`, 10, 80);

    // 绘制生命值
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(loadedImages.life, 10 + i * 30, 40, 25, 25);
    }
}

// 事件处理
function handleInput(x, y) {
    if (piggy) {
        piggy.moveTo(
            x - piggy.width / 2,
            y - piggy.height / 2
        );
    }
}

canvas.addEventListener('mousemove', (e) => {
    handleInput(e.clientX, e.clientY);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    handleInput(
        touch.clientX - rect.left,
        touch.clientY - rect.top
    );
});

// 游戏控制
function startGame() {
    console.log('Game started');
    resetGame();
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    lastTime = performance.now();
    gameLoop(lastTime);
}

function endGame() {
    console.log('Game over');
    isGamePaused = true;
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'block';
    finalScoreElement.textContent = score;
}

function resetGame() {
    piggy = new Piggy();
    walls = [];
    staticObstacles = [];
    movingObstacles = [];
    giantObstacles = [];
    score = 0;
    lives = 9;
    gameSpeed = 1;
    gameTime = 0;
    isGamePaused = false;
}

// 初始化
function init() {
    loadImages();
    resizeCanvas();
    startButton.disabled = true;
    startButton.textContent = '加载中...';
}

window.addEventListener('resize', resizeCanvas);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

init();