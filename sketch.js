const cols = 10, rows = 20, cellSize = 30;
let grid, currentPiece, nextPiece, gameOver = false;

// Tetromino-former
const tetrominoes = [
  [[1, 1, 1, 1]], // I-form
  [[1, 1], [1, 1]], // O-form
  [[0, 1, 0], [1, 1, 1]], // T-form
  [[1, 1, 0], [0, 1, 1]], // S-form
  [[0, 1, 1], [1, 1, 0]], // Z-form
  [[1, 1, 1], [0, 0, 1]], // L-form
  [[1, 1, 1], [1, 0, 0]]  // J-form
];

function setup() {
  createCanvas(cols * cellSize, rows * cellSize);
  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  currentPiece = new Piece();
  nextPiece = new Piece();
  frameRate(10);
}

function draw() {
  if (gameOver) {
    background(100);
    fill("white");
    textSize(32);
    text("Game Over", width / 4, height / 2);
    return;
  }

  background(0);
  drawGrid();
  currentPiece.show();
  
  if (frameCount % 30 === 0) {
    currentPiece.moveDown();
  }
}

function drawGrid() {
  grid.forEach((row, y) => row.forEach((cell, x) => {
    stroke(50);
    fill(cell ? "white" : "black");
    rect(x * cellSize, y * cellSize, cellSize, cellSize);
  }));
}

class Piece {
  constructor() {
    this.shape = random(tetrominoes);
    this.x = 3;
    this.y = 0;
  }

  show() {
    fill("white");
    this.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) {
          rect((this.x + x) * cellSize, (this.y + y) * cellSize, cellSize, cellSize);
        }
      })
    );
  }

  moveDown() {
    this.y++;
    if (this.collides()) {
      this.y--;
      this.merge();
      this.checkLines();
      this.spawnNewPiece();
    }
  }

  move(dir) {
    this.x += dir;
    if (this.collides()) this.x -= dir;
  }

  rotate() {
    let newShape = this.shape[0].map((_, i) => this.shape.map(row => row[i])).reverse();
    let oldShape = this.shape;
    this.shape = newShape;
    if (this.collides()) this.shape = oldShape;
  }

  hardDrop() {
    while (!this.collides()) {
      this.y++;
    }
    this.y--; // Gå én tilbage, da sidste position var ulovlig
    this.merge();
    this.checkLines();
    this.spawnNewPiece();
  }

  collides() {
    return this.shape.some((row, dy) =>
      row.some((cell, dx) => 
        cell && (grid[this.y + dy]?.[this.x + dx] || this.x + dx < 0 || this.x + dx >= cols || this.y + dy >= rows)
      )
    );
  }

  merge() {
    this.shape.forEach((row, dy) =>
      row.forEach((cell, dx) => {
        if (cell) grid[this.y + dy][this.x + dx] = 1;
      })
    );
  }

  checkLines() {
    grid = grid.filter(row => row.includes(0));
    while (grid.length < rows) {
      grid.unshift(Array(cols).fill(0));
    }
  }

  spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = new Piece();
    if (currentPiece.collides()) gameOver = true;
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) currentPiece.move(-1);
  if (keyCode === RIGHT_ARROW) currentPiece.move(1);
  if (keyCode === DOWN_ARROW) currentPiece.moveDown();
  if (keyCode === UP_ARROW) currentPiece.rotate();
  if (keyCode === 32) currentPiece.hardDrop(); 
}
