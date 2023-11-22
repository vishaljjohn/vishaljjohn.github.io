const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let meImage = new Image();
meImage.src = '/images/face.png';

const dino = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    jumping: false,
    velocity: 0
};

const obstacles = [];
let score = 0;
let gameRunning = false;

function drawDino() {
    ctx.drawImage(meImage, dino.x, dino.y, dino.width, dino.height);
}

function drawObstacle(obstacle) {
    ctx.fillStyle = '#555';
    ctx.fillRect(obstacle.x, canvas.height - obstacle.height, obstacle.width, obstacle.height);
}

function updateDino() {
    if (dino.jumping) {
        dino.velocity += 1;
        dino.y += dino.velocity;
        if (dino.y >= canvas.height - dino.height) {
            dino.y = canvas.height - dino.height;
            dino.jumping = false;
        }
    }
}

function updateObstacles() {
    if (Math.random() < 0.02) {
        const height = 20 + Math.random() * 30;
        const obstacle = {
            x: canvas.width,
            width: 20,
            height: height
        };
        obstacles.push(obstacle);
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 5;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
        }
        if (dino.x < obstacles[i].x + obstacles[i].width &&
            dino.x + dino.width > obstacles[i].x &&
            dino.y < canvas.height &&
            dino.y + dino.height > canvas.height - obstacles[i].height) {
                gameRunning = false;
                showGameOverScreen();
                return;
        }
    }
}

function drawScore() {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Score: ' + score, 8, 20);
}

function showStartScreen() {
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Press Space to Start', canvas.width / 2 - 100, canvas.height / 2);
}

function showGameOverScreen() {
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('Game Over! Press Space to Restart', canvas.width / 2 - 150, canvas.height / 2);
}

function draw() {
    if (!gameRunning) {
        showStartScreen();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDino();
    obstacles.forEach(drawObstacle);
    drawScore();
    updateDino();
    updateObstacles();
    requestAnimationFrame(draw);
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (!gameRunning) {
            gameRunning = true;
            score = 0;
            obstacles.length = 0;
            draw();
        } else if (!dino.jumping) {
            dino.jumping = true;
            dino.velocity = -15;
        }
    }
});

canvas.addEventListener('touchstart', function() {
    if (!gameRunning) {
        gameRunning = true;
        score = 0;
        obstacles.length = 0;
        draw();
    } else if (!dino.jumping) {
        dino.jumping = true;
        dino.velocity = -15;
    }
});

window.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

meImage.onload = function() {
    showStartScreen();
};

