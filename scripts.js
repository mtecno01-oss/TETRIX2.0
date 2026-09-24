const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const boardElement = document.getElementById('board');
const nextElement = document.getElementById('next-canvas');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const gameOverElement = document.getElementById('game-over');
const pauseOverlay = document.getElementById('pause-overlay');

let grid = Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(0)
);

let score = 0;
let level = 1;
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;
let gameOver = false;
let isPlaying = false;
let isPaused = false;

const SHAPES = [
    {
        shape: [[1, 1, 1, 1]],
        color: 'block-I'
    },
    {
        shape: [
            [2, 0, 0],
            [2, 2, 2]
        ],
        color: 'block-J'
    },
    {
        shape: [
            [0, 0, 3],
            [3, 3, 3]
        ],
        color: 'block-L'
    },
    {
        shape: [
            [4, 4],
            [4, 4]
        ],
        color: 'block-O'
    },
    {
        shape: [
            [0, 5, 5],
            [5, 5, 0]
        ],
        color: 'block-S'
    },
    {
        shape: [
            [0, 6, 0],
            [6, 6, 6]
        ],
        color: 'block-T'
    },
    {
        shape: [
            [7, 7, 0],
            [0, 7, 7]
        ],
        color: 'block-Z'
    }
];

let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    color: ''
};

let nextPiece = null;


/* =========================
   CREAR TABLERO
========================= */

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


/* =========================
   CREAR PANEL NEXT
========================= */

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


/* =========================
   CREAR PIEZA
========================= */

function createPiece() {

    const rand = Math.floor(Math.random() * SHAPES.length);

    return {
        matrix: SHAPES[rand].shape,
        color: SHAPES[rand].color
    };
}


/* =========================
   PREPARAR NUEVA PIEZA
========================= */

function resetPlayer() {

    if (!nextPiece) {
        nextPiece = createPiece();
    }

    player.matrix = nextPiece.matrix;
    player.color = nextPiece.color;

    nextPiece = createPiece();

    player.pos.y = 0;

    player.pos.x = Math.floor(
        (BOARD_WIDTH - player.matrix[0].length) / 2
    );

    if (checkCollision()) {

        gameOver = true;
        isPlaying = false;
        isPaused = false;

        pauseOverlay.style.display = 'none';

        gameOverElement.style.display = 'flex';

        updatePauseButtons();
    }

    drawNextPiece();
}


/* =========================
   COLISIONES
========================= */

function checkCollision() {

    const m = player.matrix;
    const o = player.pos;

    for (let r = 0; r < m.length; r++) {

        for (let c = 0; c < m[r].length; c++) {

            if (m[r][c] !== 0) {

                const newX = o.x + c;
                const newY = o.y + r;

                if (
                    newX < 0 ||
                    newX >= BOARD_WIDTH ||
                    newY >= BOARD_HEIGHT
                ) {
                    return true;
                }

                if (
                    newY >= 0 &&
                    grid[newY][newX] !== 0
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}


/* =========================
   UNIR PIEZA
========================= */

function merge() {

    player.matrix.forEach((row, r) => {

        row.forEach((value, c) => {

            if (value !== 0) {

                if (player.pos.y + r >= 0) {

                    grid[player.pos.y + r][player.pos.x + c] =
                        player.color;
                }
            }
        });
    });
}


/* =========================
   ROTAR
========================= */

function rotateMatrix(matrix) {

    const N = matrix.length;
    const M = matrix[0].length;

    const rotated = Array.from(
        { length: M },
        () => Array(N).fill(0)
    );

    for (let r = 0; r < N; r++) {

        for (let c = 0; c < M; c++) {

            rotated[c][N - 1 - r] =
                matrix[r][c];
        }
    }

    return rotated;
}


function playerRotate() {

    const oldX = player.pos.x;

    let offset = 1;

    const originalMatrix = player.matrix;

    player.matrix = rotateMatrix(player.matrix);

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


/* =========================
   MOVER
========================= */

function playerMove(dir) {

    player.pos.x += dir;

    if (checkCollision()) {

        player.pos.x -= dir;
    }
}


/* =========================
   BAJAR
========================= */

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


/* =========================
   CAÍDA RÁPIDA
========================= */

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


/* =========================
   BORRAR LÍNEAS
========================= */

function clearLines() {

    let rowCount = 0;

    outer:

    for (
        let r = BOARD_HEIGHT - 1;
        r >= 0;
        r--
    ) {

        for (
            let c = 0;
            c < BOARD_WIDTH;
            c++
        ) {

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

        score += rowCount * 100 * level;

        scoreElement.innerText = score;

        level = Math.floor(score / 500) + 1;

        levelElement.innerText = level;

        dropInterval =
            Math.max(
                100,
                1000 - (level - 1) * 100
            );
    }
}


/* =========================
   DIBUJAR TABLERO
========================= */

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


    if (player.matrix) {

        player.matrix.forEach((row, r) => {

            row.forEach((value, c) => {

                if (value !== 0) {

                    const drawY =
                        player.pos.y + r;

                    const drawX =
                        player.pos.x + c;

                    if (
                        drawY >= 0 &&
                        drawY < BOARD_HEIGHT &&
                        drawX >= 0 &&
                        drawX < BOARD_WIDTH
                    ) {

                        boardCells[drawY][drawX].className =
                            'cell ' + player.color;
                    }
                }
            });
        });
    }
}


/* =========================
   DIBUJAR SIGUIENTE PIEZA
========================= */

function drawNextPiece() {

    for (let r = 0; r < 4; r++) {

        for (let c = 0; c < 4; c++) {

            nextCells[r][c].className = 'cell';
        }
    }

    if (nextPiece) {

        const m = nextPiece.matrix;

        const offsetX =
            Math.floor((4 - m[0].length) / 2);

        const offsetY =
            Math.floor((4 - m.length) / 2);

        m.forEach((row, r) => {

            row.forEach((value, c) => {

                if (value !== 0) {

                    nextCells[offsetY + r][offsetX + c]
                        .className =
                        'cell ' + nextPiece.color;
                }
            });
        });
    }
}


/* =========================
   BUCLE DEL JUEGO
========================= */

function update(time = 0) {

    if (!isPlaying) {
        return;
    }

    const deltaTime = time - lastTime;

    lastTime = time;

    if (!isPaused) {

        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {

            playerDrop();
        }

        drawBoard();
    }

    requestAnimationFrame(update);
}


/* =========================
   PAUSA
========================= */

function togglePause() {

    if (!isPlaying || gameOver) {
        return;
    }

    isPaused = !isPaused;

    if (isPaused) {

        pauseOverlay.style.display = 'flex';

    } else {

        pauseOverlay.style.display = 'none';

        lastTime = performance.now();
    }

    updatePauseButtons();
}


function updatePauseButtons() {

    const pauseBtn =
        document.getElementById('pause-btn');

    const pauseTouchBtn =
        document.getElementById('pause-touch-btn');

    const text =
        isPaused ? '▶ CONTINUAR' : '⏸ PAUSA';

    if (pauseBtn) {
        pauseBtn.innerText = text;
    }

    if (pauseTouchBtn) {
        pauseTouchBtn.innerText = text;
    }
}


/* =========================
   CONTROLES TECLADO
========================= */

document.addEventListener('keydown', event => {

    if (!isPlaying || isPaused) {
        return;
    }

    if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === ' '
    ) {
        event.preventDefault();
    }

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

    } else if (
        event.key === 'p' ||
        event.key === 'P'
    ) {

        togglePause();
    }
});


/* =========================
   CONTROLES TÁCTILES / MOUSE
========================= */

function bindControl(id, action) {

    const button = document.getElementById(id);

    if (!button) {
        return;
    }

    button.addEventListener('pointerdown', event => {

        event.preventDefault();

        if (!isPlaying || isPaused) {
            return;
        }

        action();
    });
}


bindControl('left-btn', () => {
    playerMove(-1);
});

bindControl('right-btn', () => {
    playerMove(1);
});

bindControl('down-btn', () => {
    playerDrop();
});

bindControl('rotate-btn', () => {
    playerRotate();
});

bindControl('hard-btn', () => {
    playerHardDrop();
});


const pauseTouchButton =
    document.getElementById('pause-touch-btn');

if (pauseTouchButton) {

    pauseTouchButton.addEventListener(
        'pointerdown',
        event => {

            event.preventDefault();

            togglePause();
        }
    );
}


/* =========================
   INICIAR JUEGO
========================= */

function startGame() {

    if (isPlaying) {
        return;
    }

    resetGame();

    isPlaying = true;

    isPaused = false;

    document.getElementById('start-btn').style.display = 'none';

    pauseOverlay.style.display = 'none';

    updatePauseButtons();

    lastTime = performance.now();

    update();
}


/* =========================
   REINICIAR JUEGO
========================= */

function restartGame() {

    isPlaying = false;

    isPaused = false;

    resetGame();

    isPlaying = true;

    document.getElementById('start-btn').style.display = 'none';

    pauseOverlay.style.display = 'none';

    updatePauseButtons();

    lastTime = performance.now();

    update();
}


/* =========================
   RESET DEL TABLERO
========================= */

function resetGame() {

    grid = Array.from(
        { length: BOARD_HEIGHT },
        () => Array(BOARD_WIDTH).fill(0)
    );

    score = 0;

    level = 1;

    dropInterval = 1000;

    dropCounter = 0;

    scoreElement.innerText = score;

    levelElement.innerText = level;

    gameOver = false;

    gameOverElement.style.display = 'none';

    pauseOverlay.style.display = 'none';

    nextPiece = null;

    resetPlayer();

    drawBoard();

    updatePauseButtons();
}


/* =========================
   BOTÓN PAUSA DEL PANEL
========================= */

const pauseSideButton =
    document.getElementById('pause-btn');

if (pauseSideButton) {

    pauseSideButton.addEventListener(
        'pointerdown',
        event => {

            event.preventDefault();

            togglePause();
        }
    );
}