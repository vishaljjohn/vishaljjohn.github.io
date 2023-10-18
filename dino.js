const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let meImage = new Image();
meImage.src = 'me.png';

const dino = {
    x: 50,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    jumping: false,
    velocity: 0
};

const obstacles = [];

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
        }
        if (dino.x < obstacles[i].x + obstacles[i].width &&
            dino.x + dino.width > obstacles[i].x &&
            dino.y < canvas.height &&
            dino.y + dino.height > canvas.height - obstacles[i].height) {
                obstacles.length = 0;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawDino();
    obstacles.forEach(drawObstacle);

    updateDino();
    updateObstacles();

    requestAnimationFrame(draw);
}

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !dino.jumping) {
        dino.jumping = true;
        dino.velocity = -15;
    }
});

canvas.addEventListener('touchstart', function() {
    if (!dino.jumping) {
        dino.jumping = true;
        dino.velocity = -15;
    }
});

window.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

meImage.onload = function() {
    draw();
};
