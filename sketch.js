const cols = 10, rows = 20;
let cellSize;
let grid, currentPiece, nextPiece, heldPiece = null, canHold = true, gameOver = false;
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
  { shape: [[1, 1, 1, 1]], color: "#00f" }, // I
  { shape: [[1, 1], [1, 1]], color: "#ff0" }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: "#f0f" }, // T
  { shape: [[1, 1, 0], [0, 1, 1]], color: "#0f0" }, // S
  { shape: [[0, 1, 1], [1, 1, 0]], color: "#f00" }, // Z
  { shape: [[1, 1, 1], [0, 0, 1]], color: "#ffa500" }, // L
  { shape: [[1, 1, 1], [1, 0, 0]], color: "#00fa9a" }  // J
];

function setup() {
  // Dynamisk cellestørrelse baseret på vinduets bredde og højde
  cellSize = Math.min(windowWidth / (cols + 6), windowHeight / rows); // Øget plads til sidebar
  createCanvas(cols * cellSize + 180, rows * cellSize); // Øget sidebar-bredde

  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  currentPiece = new Piece();
  nextPiece = new Piece();
  frameRate(60);
}

function windowResized() {
  // Opdater canvas-størrelse, hvis vinduet ændres
  cellSize = Math.min(windowWidth / (cols + 6), windowHeight / rows); // Øget plads til sidebar
  resizeCanvas(cols * cellSize + 180, rows * cellSize); // Øget sidebar-bredde
}

function draw() {
  background("#222"); // Mørk baggrund

  // Hvis spillet ikke er startet, vis startskærmen
  if (!started) {
    drawStartScreen();
    return; // Stop yderligere tegning, indtil spillet starter
  }

  // Hvis spillet er slut, vis "Game Over"-skærmen
  if (gameOver) {
    drawGameOverScreen();
    return; // Stop yderligere tegning, indtil spillet genstartes
  }

  // Tegn spilleområdet
  fill("#333");
  stroke("#555");
  rect(0, 0, cols * cellSize, rows * cellSize);

  // Tegn gitteret og den aktuelle brik
  drawGrid();
  currentPiece.showGhost(); // Vis ghost piece
  currentPiece.show();

  // Sidebar
  fill("white");
  textSize(16);
  textAlign(LEFT);
  text("Score: " + score, cols * cellSize + 20, 20);
  text("Level: " + level, cols * cellSize + 20, 40);

  // Vis næste brik
  text("Næste:", cols * cellSize + 20, 80);
  nextPiece.showPreview(cols * cellSize + 20, 100);

  // Vis gemt brik (rykket længere ned)
  text("Hold:", cols * cellSize + 20, 300); // Ændret y-koordinat fra 200 til 300
  if (heldPiece) {
    heldPiece.showPreview(cols * cellSize + 20, 320); // Ændret y-koordinat fra 220 til 320
  }

  // Drop brikken periodisk
  if (frameCount % dropSpeed === 0) {
    currentPiece.moveDown();
  }

  handleInput();
}

function drawStartScreen() {
  // Baggrundsgradient
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color("#333"), color("#555"), inter);
    stroke(c);
    line(0, i, width, i);
  }

  // Titel
  fill("#fff");
  textAlign(CENTER);
  textSize(48);
  text("TETRIS", width / 2, height / 2 - 60);

  // Instruktion
  textSize(20);
  fill("#aaa");
  text("Tryk ENTER for at starte", width / 2, height / 2);

  // Footer
  textSize(14);
  fill("#777");
  text("Programmeret af Michael, Oliver og Villum", width / 2, height - 20);
}

function drawGameOverScreen() {
  // Baggrundsgradient
  for (let i = 0; i < height; i++) {
    let inter = map(i, 0, height, 0, 1);
    let c = lerpColor(color("#550000"), color("#220000"), inter);
    stroke(c);
    line(0, i, width, i);
  }

  // Titel
  fill("#fff");
  textAlign(CENTER);
  textSize(48);
  text("GAME OVER", width / 2, height / 2 - 60);

  // Score
  textSize(20);
  fill("#aaa");
  text("Score: " + score, width / 2, height / 2);

  // Instruktion
  textSize(20);
  fill("#aaa");
  text("Tryk ENTER for at genstarte", width / 2, height / 2 + 40);
}

function drawGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x]) {
        fill(grid[y][x]); // Brug farven fra gitteret
      } else {
        fill("#333"); // Standard baggrundsfarve for tomme celler
      }
      stroke("#555");
      rect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

class Piece {
  constructor(tetromino = null) {
    const tetrominoData = tetromino || random(tetrominoes);
    this.shape = tetrominoData.shape;
    this.color = tetrominoData.color;
    this.x = 3;
    this.y = 0;
  }

  show() {
    fill(this.color);
    stroke("#555");
    this.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) {
          rect((this.x + x) * cellSize, (this.y + y) * cellSize, cellSize, cellSize);
        }
      })
    );
  }

  showPreview(xOffset, yOffset) {
    fill(this.color);
    stroke("#555");

    // Beregn forskydning for at centrere brikken i sidebaren
    const previewWidth = this.shape[0].length * cellSize;
    const previewHeight = this.shape.length * cellSize;
    const xCenterOffset = (120 - previewWidth) / 2; // Juster for sidebarens bredde
    const yCenterOffset = (120 - previewHeight) / 2;

    this.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) {
          rect(xOffset + x * cellSize + xCenterOffset, yOffset + y * cellSize + yCenterOffset, cellSize, cellSize);
        }
      })
    );
  }

  showGhost() {
    let ghostY = this.y;

    // Flyt brikken nedad så langt den kan komme
    while (!this.shape.some((row, dy) =>
      row.some((cell, dx) =>
        cell && (
          grid[ghostY + dy + 1]?.[this.x + dx] || 
          this.x + dx < 0 || 
          this.x + dx >= cols || 
          ghostY + dy + 1 >= rows)
      )
    )) {
      ghostY++;
    }

    // Tegn brikken i ghost-position
    noStroke();
    fill(255, 255, 255, 50); // Hvid med lav gennemsigtighed
    this.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) {
          rect((this.x + x) * cellSize, (ghostY + y) * cellSize, cellSize, cellSize);
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
        if (cell) grid[this.y + dy][this.x + dx] = this.color; // Gem farven
      })
    );
  }

  checkLines() {
    let fullRows = grid.filter(row => row.every(cell => cell));
    let cleared = fullRows.length;
    linesCleared += cleared;

    // Giv point efter hvor mange linjer der blev ryddet
    if (cleared === 1) score += 100;
    else if (cleared === 2) score += 300;
    else if (cleared === 3) score += 500;
    else if (cleared === 4) score += 800;

    grid = grid.filter(row => !row.every(cell => cell));
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
    canHold = true; // Tillad at holde en ny brik, når en ny brik spawnes
  }
}

function updateLevel() {
  level = Math.floor(linesCleared / 5) + 1;
  dropSpeed = max(5, 48 - (level * 3)); 
}

function handleInput() {
  Object.keys(keys).forEach(key => {
    if (keys[key]) {
      if (keyTimers[key] > 0) {
        keyTimers[key]--;
      } else {
        if (key == LEFT_ARROW) currentPiece.move(-1);
        if (key == RIGHT_ARROW) currentPiece.move(1);
        if (key == DOWN_ARROW) currentPiece.moveDown();
        keyTimers[key] = repeatKeySpeed;
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
    gameOver = false;
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    currentPiece = new Piece();
    nextPiece = new Piece();
    score = 0;
    level = 1;
    linesCleared = 0;
    heldPiece = null; // Nulstil gemt brik
    canHold = true; // Tillad at holde en brik
    return;
  }

  if (gameOver && keyCode === ENTER) {
    // Genstart spillet
    gameOver = false;
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    currentPiece = new Piece();
    nextPiece = new Piece();
    score = 0;
    level = 1;
    linesCleared = 0;
    heldPiece = null; // Nulstil gemt brik
    canHold = true; // Tillad at holde en brik
    started = true;
    return;
  }

  if (key === 'c' || key === 'C') {
    if (canHold) {
      if (heldPiece) {
        // Byt den aktuelle brik med den gemte brik
        const temp = heldPiece;
        heldPiece = new Piece({ shape: currentPiece.shape, color: currentPiece.color });
        currentPiece = new Piece({ shape: temp.shape, color: temp.color });
      } else {
        // Gem den aktuelle brik
        heldPiece = new Piece({ shape: currentPiece.shape, color: currentPiece.color });
        currentPiece = nextPiece;
        nextPiece = new Piece();
      }
      canHold = false; // Tillad kun én hold pr. tur
    }
    return;
  }

  if (!keys[keyCode] && !paused) {
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