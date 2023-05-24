/**
 * Script file for the hidden snake game.
 */


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

// Changing the snake's direction and velocity based on the button clicked
const changeDirection = (event) => {
  if (event.key === "ArrowUp" && velocityY != 1) {
    velocityX = 0;
    velocityY = -1;
  } else if (event.key === "ArrowDown" && velocityY != -1) {
    velocityX = 0;
    velocityY = 1;
  } else if (event.key === "ArrowLeft" && velocityX != 1) {
    velocityX = -1;
    velocityY = 0;
  } else if (event.key === "ArrowRight" && velocityX != -1) {
    velocityX = 1;
    velocityY = 0;
  }
};

// Adding event listeners to change the direction on button click
controls.forEach((button) =>
  button.addEventListener("click", () =>
    changeDirection({ key: button.dataset.key })
  )
);

// Handling game over situation
const handleGameOver = () => {
  clearInterval(intervalId);
  alert("Game Over! Press OK to replay...");
  location.reload();
};

// Getting high score from local storage
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `High Score: ${highScore}`;
const updateFoodPosition = () => {
  foodX = Math.floor(Math.random() * GRID_SIZE) + 1;
  foodY = Math.floor(Math.random() * GRID_SIZE) + 1;
};

// Initializing the game
const initGame = () => {
  if (gameOver) return handleGameOver();
  let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

  // Checking if the snake hit the food
  if (snakeX === foodX && snakeY === foodY) {
    updateFoodPosition();
    snakeBody.push([foodY, foodX]);
    score++;
    highScore = score >= highScore ? score : highScore;
    localStorage.setItem("high-score", highScore);
    scoreElement.innerText = `Score: ${score}`;
    highScoreElement.innerText = `High Score: ${highScore}`;
  }

  // Updating the snake's head position based on the current velocity
  snakeX += velocityX;
  snakeY += velocityY;

  // Shifting the values of the elements in the snake body by one
  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i] = snakeBody[i - 1];
  }

  // Setting first element of snake body to current snake position
  snakeBody[0] = [snakeX, snakeY];

  // Checking if the snake's moves past the wall, if so setting gameOver to true
  if (snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
    return (gameOver = true);
  }

  // Adding a div for each part of the snake's body
  for (let i = 0; i < snakeBody.length; i++) {
    html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;

    // Checking if the snake head hit the body, if so set gameOver to true
    if (
      i !== 0 &&
      snakeBody[0][1] === snakeBody[i][1] &&
      snakeBody[0][0] === snakeBody[i][0]
    ) {
      gameOver = true;
    }
  }
  playBoard.innerHTML = html;
};

updateFoodPosition();
intervalId = setInterval(initGame, 130);
document.addEventListener("keyup", changeDirection);
