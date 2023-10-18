const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let bird = {
    x: canvas.width / 5,
    y: canvas.height / 2,
    size: 40,
    dy: 2
};

let faceImage = new Image();
faceImage.src = '/images/face.png';

let pipes = [];
let pipeSpacing = 150;
let pipeWidth = 50;
let pipeGap = 100;

function drawBird() {
    ctx.drawImage(faceImage, bird.x, bird.y, bird.size, bird.size);
}

function drawPipe(pipe) {
    ctx.fillStyle = 'green';
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - pipe.top - pipeGap);
}

function updateBird() {
    bird.y += bird.dy;
}

function updatePipes() {
    for(let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 2;
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
        if (bird.x + bird.size > pipes[i].x && bird.x < pipes[i].x + pipeWidth) {
            if (bird.y < pipes[i].top || bird.y + bird.size > pipes[i].top + pipeGap) {
                bird.y = canvas.height / 2;
                pipes = [];
            }
        }
    }

    if (pipes.length == 0 || pipes[pipes.length - 1].x <= canvas.width - pipeSpacing) {
        let pipeTop = Math.random() * (canvas.height - pipeGap);
        pipes.push({ x: canvas.width, top: pipeTop });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBird();
    pipes.forEach(drawPipe);
    updateBird();
    updatePipes();
    requestAnimationFrame(draw);
}

canvas.addEventListener('click', function() {
    bird.dy = -5;
});

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    bird.dy = -5;
});

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        bird.dy = -5;
    }
});

window.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

setInterval(function() {
    bird.dy += 1;
}, 150);

faceImage.onload = function() {
    draw();
};

