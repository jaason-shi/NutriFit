const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");

// Initializing the game variables
const GRID_SIZE = 30;
let gameOver = false;
let foodX, foodY;
let snakeX = 5,
  snakeY = 5;
let velocityX = 0,
  velocityY = 0;
let snakeBody = [];
let intervalId;
let score = 0;

// Getting high score from local storage
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `High Score: ${highScore}`;
const updateFoodPosition = () => {
  foodX = Math.floor(Math.random() * GRID_SIZE) + 1;
  foodY = Math.floor(Math.random() * GRID_SIZE) + 1;
};

// Handling game over situation
const handleGameOver = () => {
  clearInterval(setIntervalId);
  alert("Game Over! Press OK to replay...");
  location.reload();
};
