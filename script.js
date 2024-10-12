const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreElement = document.getElementById('finalScore');
const loadingMessage = document.getElementById('loadingMessage');

let gameLoop;
let piggy;
let walls = [];
let staticObstacles = [];
let movingObstacles = [];
let giantObstacles = [];
let score = 0;
let lives = 9;
let gameSpeed = 1;
let gameTime = 0;

const piggyImage = new Image();
const lifeImage = new Image();
const staticObstacleImage = new Image();
const movingObstacleImage = new Image();
const giantObstacleImage = new Image();

const images = [
    { img: piggyImage, src: 'https://i.imgur.com/C0QUUdq.png', name: 'Piggy' },
    { img: lifeImage, src: 'https://i.imgur.com/C9A5LoF.png', name: 'Life' },
    { img: staticObstacleImage, src: 'https://i.imgur.com/339wcBE.png', name: 'Static Obstacle' },
    { img: movingObstacleImage, src: 'https://i.imgur.com/UaSzf5z.png', name: 'Moving Obstacle' },
    { img: giantObstacleImage, src: 'https://i.imgur.com/339wcBE.png', name: 'Giant Obstacle' }
];

let imagesLoaded = 0;
const totalImages = images.length;

function imageLoaded() {
    imagesLoaded++;
    loadingMessage.textContent = `加载中... (${imagesLoaded}/${totalImages})`;
    console.log(`Image loaded: ${imagesLoaded}/${totalImages}`);
    if (imagesLoaded === totalImages) {
        console.log('All images loaded');
        startButton.disabled = false;
        startButton.textContent = '开始游戏';
        loadingMessage.style.display = 'none';
    }
}

images.forEach(({ img, src, name }) => {
    img.onload = () => {
        console.log(`${name} image loaded successfully`);
        imageLoaded();
    };
    img.onerror = () => {
        console.error(`Failed to load ${name} image: ${src}`);
        imageLoaded(); // Still increment the counter to avoid getting stuck
    };
    img.src = src;
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (piggy) {
        piggy.x = Math.min(piggy.x, canvas.width - piggy.width);
        piggy.y = Math.min(piggy.y, canvas.height - piggy.height);
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Piggy {
    constructor() {
        this.width = 50;
        this.height = 50;
        this.x = 50;
        this.y = canvas.height / 2 - this.height / 2;
    }

    draw() {
        ctx.drawImage(piggyImage, this.x, this.y, this.width, this.height);
    }
}

class Wall {
    constructor() {
        this.width = 20;
        this.height = Math.random() * (canvas.height - 200) + 100;
        this.x = canvas.width;
        this.y = Math.random() > 0.5 ? 0 : canvas.height - this.height;
    }

    draw() {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= 3 * gameSpeed;
    }
}

class StaticObstacle {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
    }

    draw() {
        ctx.drawImage(staticObstacleImage, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= 3 * gameSpeed;
    }
}

class MovingObstacle {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.speedY = (Math.random() - 0.5) * 5 * gameSpeed;
    }

    draw() {
        ctx.drawImage(movingObstacleImage, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= 4 * gameSpeed;
        this.y += this.speedY;
        if (this.y <= 0 || this.y + this.height >= canvas.height) {
            this.speedY = -this.speedY;
        }
    }
}

class GiantObstacle {
    constructor() {
        this.width = 120;
        this.height = 120;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
    }

    draw() {
        ctx.drawImage(giantObstacleImage, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= 2 * gameSpeed;
    }
}

function startGame() {
    console.log('Game started');
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    piggy = new Piggy();
    walls = [];
    staticObstacles = [];
    movingObstacles = [];
    giantObstacles = [];
    score = 0;
    lives = 9;
    gameSpeed = 1;
    gameTime = 0;
    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(update);
}

function endGame() {
    console.log('Game over');
    cancelAnimationFrame(gameLoop);
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'block';
    finalScoreElement.textContent = score;
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    gameTime++;
    if (gameTime % 300 === 0) { // Increase difficulty every 5 seconds
        gameSpeed += 0.2;
        console.log(`Game speed increased to ${gameSpeed.toFixed(2)}`);
    }

    piggy.draw();

    if (Math.random() < 0.03 * gameSpeed) {
        walls.push(new Wall());
    }

    if (Math.random() < 0.02 * gameSpeed) {
        staticObstacles.push(new StaticObstacle());
    }

    if (Math.random() < 0.01 * gameSpeed) {
        movingObstacles.push(new MovingObstacle());
    }

    if (Math.random() < 0.002 * gameSpeed) {
        giantObstacles.push(new GiantObstacle());
    }

    walls.forEach((wall, index) => {
        wall.update();
        wall.draw();

        if (wall.x + wall.width < 0) {
            walls.splice(index, 1);
        }

        if (checkCollision(piggy, wall)) {
            score += 100;
            walls.splice(index, 1);
        }
    });

    staticObstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();

        if (obstacle.x + obstacle.width < 0) {
            staticObstacles.splice(index, 1);
        }

        if (checkCollision(piggy, obstacle)) {
            lives--;
            staticObstacles.splice(index, 1);
            if (lives <= 0) {
                endGame();
            }
        }
    });

    movingObstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();

        if (obstacle.x + obstacle.width < 0) {
            movingObstacles.splice(index, 1);
        }

        if (checkCollision(piggy, obstacle)) {
            lives--;
            movingObstacles.splice(index, 1);
            if (lives <= 0) {
                endGame();
            }
        }
    });

    giantObstacles.forEach((obstacle, index) => {
        obstacle.update();
        obstacle.draw();

        if (obstacle.x + obstacle.width < 0) {
            giantObstacles.splice(index, 1);
        }

        if (checkCollision(piggy, obstacle)) {
            lives -= 2; // Giant obstacles cause more damage
            giantObstacles.splice(index, 1);
            if (lives <= 0) {
                endGame();
            }
        }
    });

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`得分: ${score}`, 10, 30);

    // Draw lives
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(lifeImage, 10 + i * 30, 40, 25, 25);
    }

    // Draw game speed
    ctx.fillText(`速度: ${gameSpeed.toFixed(2)}x`, 10, 80);

    gameLoop = requestAnimationFrame(update);
}

function handleInput(x, y) {
    if (piggy) {
        piggy.x = Math.max(0, Math.min(x - piggy.width / 2, canvas.width - piggy.width));
        piggy.y = Math.max(0, Math.min(y - piggy.height / 2, canvas.height - piggy.height));
    }
}

canvas.addEventListener('mousemove', (e) => {
    handleInput(e.clientX, e.clientY);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    handleInput(x, y);
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startGame();
});

startButton.disabled = true;
startButton.textContent = '加载中...';

console.log('Script loaded');

function checkImagesLoaded() {
    console.log(`Checking images: ${imagesLoaded}/${totalImages} loaded`);
    images.forEach(({ img, name }) => {
        console.log(`${name} image complete: ${img.complete}`);
    });
}

window.addEventListener('load', () => {
    console.log('Window loaded');
    checkImagesLoaded();
});

setTimeout(() => {
    if (imagesLoaded < totalImages) {
        console.log('Images not loaded after 5 seconds, forcing completion');
        checkImagesLoaded();
        while (imagesLoaded < totalImages) {
            imageLoaded();
        }
    }
}, 5000);
