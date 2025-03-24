// Definerer spillets dimensioner og celle størrelse
const cols = 10, rows = 20, cellSize = 30;

// Initialiserer variabler til gitteret
let grid;

// De forskellige brikker (tetrominoes), de skal ikke ændres undervejs, og der bruges derfor "const"
const tetrominoes = [
[[1, 1, 1, 1]], // I-form
[[1, 1], [1, 1]], // O-form
[[0, 1, 0], [1, 1, 1]], // T-form
[[1, 1, 0], [0, 1, 1]], // S-form
[[0, 1, 1], [1, 1, 0]], // Z-form
[[1, 1, 1], [0, 0, 1]], // L-form
[[1, 1, 1], [1, 0, 0]]  // J-form
];
 

// Setup-funktion, der kører én gang ved start
function setup() {
  createCanvas(cols * cellSize, rows * cellSize); // Opretter canvas i den rette størrelse
  grid = Array.from({ length: rows }, () => Array(cols).fill(0)); // Initialiserer et tomt gitter
  currentPiece = new Piece(); // Opretter en ny brik
  nextPiece = new Piece(); // Opretter den næste brik
}

// Hoved-loopet, der opdaterer spillet og tegner elementerne
function draw() {
  background(0); // Sætter baggrunden til sort
  drawGrid(); // Tegner spillepladen
}

// Funktion til at tegne gitteret på canvas
function drawGrid() {
  grid.forEach((row, y) => row.forEach((cell, x) => {
    stroke(50); // Tegner kantfarve
    
    if (cell) {
      fill('white'); // Hvis feltet er 1 (fyldt), tegnes det hvidt
    } else {
      fill('black'); // Ellers tegnes det sort
    }
    
    rect(x * cellSize, y * cellSize, cellSize, cellSize); // Tegner rektangler for hver celle
  }));
}

// Klasse, der repræsenterer en brik
class Piece {
  constructor() {
    this.shape = random(tetrominoes); // Vælger en tilfældig form
    this.x = 3; // Starter i midten af spilleområdet
    this.y = 0; // Starter øverst
  }
  // Tegner brikken på spilleområdet
  show() {
    fill("white"); // Brikkerne vises i hvid
    this.shape.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) {
          rect((this.x + x) * cellSize, (this.y + y) * cellSize, cellSize, cellSize);
        }
      })
    );
  }
}
