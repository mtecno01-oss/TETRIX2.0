const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const boardElement = document.getElementById('board');
const nextElement = document.getElementById('next-canvas');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('game-over');

let grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
let score = 0;
let level = 1;
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;
let isPlaying = false;

// Definición de piezas (Tetrominós) y sus colores/clases neón
const SHAPES = [{
        shape: [
            [1, 1, 1, 1]
        ],
        color: 'block-I'
    }, // I
    {
        shape: [
            [2, 0, 0],
            [2, 2, 2]
        ],
        color: 'block-J'
    }, // J
    {
        shape: [
            [0, 0, 3],
            [3, 3, 3]
        ],
        color: 'block-L'
    }, // L
    {
        shape: [
            [4, 4],
            [4, 4]
        ],
        color: 'block-O'
    }, // O
    {
        shape: [
            [0, 5, 5],
            [5, 5, 0]
        ],
        color: 'block-S'
    }, // S
    {
        shape: [
            [0, 6, 0],
            [6, 6, 6]
        ],
        color: 'block-T'
    }, // T
    {
        shape: [
            [7, 7, 0],
            [0, 7, 7]
        ],
        color: 'block-Z'
    } // Z
];

let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    color: ''
};

let nextPiece = null;

// Inicializar la grilla visual del tablero principal
const boardCells = [];
for (let r = 0; r < BOARD_HEIGHT; r++) {
    boardCells[r] = [];
    for (let c = 0; c < BOARD_WIDTH; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        boardElement.appendChild(cell);
        boardCells[r][c] = cell;
    }
}

// Inicializar la grilla visual de la siguiente pieza
const nextCells = [];
for (let r = 0; r < 4; r++) {
    nextCells[r] = [];
    for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        nextElement.appendChild(cell);
        nextCells[r][c] = cell;
    }
}

function createPiece() {
    const rand = Math.floor(Math.random() * SHAPES.length);
    return {
        matrix: SHAPES[rand].shape,
        color: SHAPES[rand].color
    };
}

function resetPlayer() {
    if (!nextPiece) {
        nextPiece = createPiece();
    }
    player.matrix = nextPiece.matrix;
    player.color = nextPiece.color;
    nextPiece = createPiece();

    player.pos.y = 0;
    player.pos.x = Math.floor((BOARD_WIDTH - player.matrix[0].length) / 2);

    if (checkCollision()) {
        gameOver = true;
        isPlaying = false;
        gameOverElement.style.display = 'flex';
    }
    drawNextPiece();
}

function checkCollision() {
    const m = player.matrix;
    const o = player.pos;
    for (let r = 0; r < m.length; r++) {
        for (let c = 0; c < m[r].length; c++) {
            if (m[r][c] !== 0) {
                let newX = o.x + c;
                let newY = o.y + r;
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                if (newY >= 0 && grid[newY][newX] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge() {
    player.matrix.forEach((row, r) => {
        row.forEach((value, c) => {
            if (value !== 0) {
                if (player.pos.y + r >= 0) {
                    grid[player.pos.y + r][player.pos.x + c] = player.color;
                }
            }
        });
    });
}

function rotateMatrix(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    let rotated = Array.from({ length: M }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < M; c++) {
            rotated[c][N - 1 - r] = matrix[r][c];
        }
    }
    return rotated;
}

function playerRotate() {
    const oldX = player.pos.x;
    let offset = 1;
    const originalMatrix = player.matrix;
    player.matrix = rotateMatrix(player.matrix);

    // Wall kick simple por si rota contra la pared
    while (checkCollision()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            player.matrix = originalMatrix;
            player.pos.x = oldX;
            return;
        }
    }
}

function playerMove(dir) {
    player.pos.x += dir;
    if (checkCollision()) {
        player.pos.x -= dir;
    }
}

function playerDrop() {
    player.pos.y++;
    if (checkCollision()) {
        player.pos.y--;
        merge();
        clearLines();
        resetPlayer();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!checkCollision()) {
        player.pos.y++;
    }
    player.pos.y--;
    merge();
    clearLines();
    resetPlayer();
    dropCounter = 0;
}

function clearLines() {
    let rowCount = 0;
    outer: for (let r = BOARD_HEIGHT - 1; r >= 0; r--) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
            if (grid[r][c] === 0) {
                continue outer;
            }
        }
        const row = grid.splice(r, 1)[0].fill(0);
        grid.unshift(row);
        r++;
        rowCount++;
    }
    if (rowCount > 0) {
        // Sistema de puntaje clásico adaptado
        score += rowCount * 100 * level;
        scoreElement.innerText = score;

        // Subir nivel cada 500 puntos
        level = Math.floor(score / 500) + 1;
        levelElement.innerText = level;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    }
}

function drawBoard() {
    for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
            const cell = boardCells[r][c];
            cell.className = 'cell';
            if (grid[r][c] !== 0) {
                cell.classList.add(grid[r][c]);
            }
        }
    }

    // Dibujar pieza actual
    if (player.matrix) {
        player.matrix.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value !== 0) {
                    let drawY = player.pos.y + r;
                    let drawX = player.pos.x + c;
                    if (drawY >= 0 && drawY < BOARD_HEIGHT && drawX >= 0 && drawX < BOARD_WIDTH) {
                        boardCells[drawY][drawX].className = 'cell ' + player.color;
                    }
                }
            });
        });
    }
}

function drawNextPiece() {
    // Limpiar panel de siguiente
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            nextCells[r][c].className = 'cell';
        }
    }
    if (nextPiece) {
        const m = nextPiece.matrix;
        const offsetX = Math.floor((4 - m[0].length) / 2);
        const offsetY = Math.floor((4 - m.length) / 2);
        m.forEach((row, r) => {
            row.forEach((value, c) => {
                if (value !== 0) {
                    nextCells[offsetY + r][offsetX + c].className = 'cell ' + nextPiece.color;
                }
            });
        });
    }
}

function update(time = 0) {
    if (!isPlaying) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    drawBoard();
    requestAnimationFrame(update);
}

// Controles por teclado
document.addEventListener('keydown', event => {
    if (!isPlaying) return;
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'ArrowUp') {
        playerRotate();
    } else if (event.key === ' ') {
        playerHardDrop();
    }
});

function startGame() {
    if (isPlaying) return;
    resetGame();
    isPlaying = true;
    document.getElementById('start-btn').style.display = 'none';
    lastTime = performance.now();
    update();
}

function resetGame() {
    grid = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    dropInterval = 1000;
    scoreElement.innerText = score;
    levelElement.innerText = level;
    gameOver = false;
    gameOverElement.style.display = 'none';
    nextPiece = null;
    resetPlayer();
}