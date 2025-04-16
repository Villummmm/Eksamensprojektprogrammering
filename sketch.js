const cols = 10, rows = 20, cellSize = 30;
let grid, currentPiece, nextPiece, gameOver = false;
let level = 1;
let linesCleared = 0; 
let dropSpeed = 48; // Frames pr. fald, lavere tal = hurtigere fald.
let score = 0; // Holder styr på spillerens point
let paused = false; // Er spillet sat på pause?
let started = false; // Er spillet startet endnu?

let keys = {}; // Holder styr på hvilke taster der holdes nede
let keyTimers = {}; // Holder styr på tid før gentagen bevægelse
const initialKeyDelay = 15; // Frames før man kan holde en tast nede (ca. 0.25 sekunder)
const repeatKeySpeed = 5; // Hastighed på gentaget bevægelse

const tetrominoes = [
  [[1, 1, 1, 1]],  
  [[1, 1], [1, 1]], 
  [[0, 1, 0], [1, 1, 1]], 
  [[1, 1, 0], [0, 1, 1]], 
  [[0, 1, 1], [1, 1, 0]], 
  [[1, 1, 1], [0, 0, 1]], 
  [[1, 1, 1], [1, 0, 0]]  
];

function setup() {
  createCanvas(cols * cellSize + 120, rows * cellSize);
  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  currentPiece = new Piece();
  nextPiece = new Piece();
  frameRate(60);
}

function draw() {
  background(0);

  // Vis startskærm hvis spillet ikke er startet endnu
  if (!started) {
    fill("white");
    textAlign(CENTER);
    textSize(32);
    text("TETRIS", width / 2, height / 2 - 40);
    textSize(16);
    text("Tryk ENTER for at starte", width / 2, height / 2);
    return;
  }

  // Hvis spillet er slut
  if (gameOver) {
    fill("white");
    textSize(32);
    text("Game Over", width / 4, height / 2);
    return;
  }

  // Hvis spillet er pauset
  if (paused) {
    fill("white");
    textSize(32);
    text("PAUSE", width / 2 - 60, height / 2);
    return;
  }

  // Tegn score og level tekst
  fill("white");
  textSize(16);
  textAlign(LEFT);
  text("Score: " + score, cols * cellSize + 10, 20);
  text("Level: " + level, cols * cellSize + 10, 40);

  drawGrid();
  currentPiece.show();

  if (frameCount % dropSpeed === 0) {
    currentPiece.moveDown();
  }

  handleInput();
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
      this.merge(); // Lås brikken fast straks
      this.checkLines(); // Tjek for fulde linjer
      this.spawnNewPiece(); // Spawn ny brik
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
    
    if (this.collides()) {
      this.shape = oldShape;
    }
  }

  hardDrop() {
    while (!this.collides()) {
      this.y++;
    }
    this.y--;
    this.merge(); // Lås brikken fast med det samme
    this.checkLines(); // Tjek for fulde linjer
    this.spawnNewPiece(); // Spawn ny brik
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
    let fullRows = grid.filter(row => row.every(cell => cell === 1));
    let cleared = fullRows.length;
    linesCleared += cleared;

    // Giv point efter hvor mange linjer der blev ryddet
    if (cleared === 1) score += 100;
    else if (cleared === 2) score += 300;
    else if (cleared === 3) score += 500;
    else if (cleared === 4) score += 800;

    grid = grid.filter(row => !fullRows.includes(row));
    while (grid.length < rows) {
      grid.unshift(Array(cols).fill(0));
    }

    updateLevel();
  }

  spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = new Piece();
    if (currentPiece.collides()) {
      gameOver = true;
    }
  }
}

function updateLevel() {
  level = Math.floor(linesCleared / 5) + 1;
  dropSpeed = max(5, 48 - (level * 3)); 
}

// Håndterer input med forsinkelse på gentagelse
function handleInput() {
  Object.keys(keys).forEach(key => {
    if (keys[key]) {
      if (keyTimers[key] > 0) {
        keyTimers[key]--;
      } else {
        if (key == LEFT_ARROW) currentPiece.move(-1);
        if (key == RIGHT_ARROW) currentPiece.move(1);
        if (key == DOWN_ARROW) currentPiece.moveDown();
        keyTimers[key] = repeatKeySpeed; // Sætter en lille forsinkelse
      }
    }
  });
}

function keyPressed() {
  if (key === 'p' || key === 'P') {
    paused = !paused;
    return;
  }
  
  if (!started && keyCode === ENTER) {
    started = true;
    return;
  }

  if (!keys[keyCode] && !paused) { // Brug ikke taster når spillet er pauset
    if (keyCode === LEFT_ARROW) currentPiece.move(-1);
    if (keyCode === RIGHT_ARROW) currentPiece.move(1);
    if (keyCode === DOWN_ARROW) currentPiece.moveDown();
    if (keyCode === UP_ARROW) currentPiece.rotate();
    if (keyCode === 32) currentPiece.hardDrop();
  }

  keys[keyCode] = true;
  keyTimers[keyCode] = initialKeyDelay;
}

function keyReleased() {
  keys[keyCode] = false;
}
