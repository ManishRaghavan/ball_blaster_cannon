// Game constants
const SCALE_FACTOR = 1;
const GRAVITY = 0.1;
const BOUNCE_DAMPENING = 0.8;
const INITIAL_FIRE_RATE = 8; // Already increased from 5 to 8 for easier gameplay
const INITIAL_BULLET_POWER = 5; // Further increased from 3 to 5 for even easier gameplay
const SPLASH_DURATION = 3000; // Splash screen shows for 3 seconds

// Adjustable dimensions
let CANVAS_WIDTH = 512;
let CANVAS_HEIGHT = 768;
let MIN_BALL_RADIUS = 20;
let MAX_BALL_RADIUS = 40;
let MIN_SPLIT_RADIUS = 20;
let CANNON_WIDTH;
let CANNON_HEIGHT;
let BULLET_SPEED;
let currentScaleFactor = SCALE_FACTOR; // Track current scale factor separately

// Game variables
let cannon;
let balls = [];
let bullets = [];
let backgroundImage; // Game background image
let splashImage; // Splash screen image
let score = 0;
let gameOver = false;
let level = 1;
let fireRate = INITIAL_FIRE_RATE;
let bulletPower = INITIAL_BULLET_POWER;
let lastBulletTime = 0;
let gameState = "SPLASH"; // 'SPLASH', 'TITLE', 'PLAYING', 'GAME_OVER'
let splashStartTime = 0;
let transitionPos = 0; // For tracking transition animation

// Preload assets
function preload() {
  // Load game background and splash screen with error handling
  loadImage(
    "ball_blaster_bg.webp",
    (img) => (backgroundImage = img),
    () => console.error("Failed to load game background")
  );

  loadImage(
    "title_bg.webp",
    (img) => (splashImage = img),
    () => console.error("Failed to load splash screen")
  );
}

// Calculate responsive dimensions
function calculateDimensions() {
  // Get window dimensions
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  // Use full screen dimensions instead of fixed base dimensions
  CANVAS_WIDTH = windowWidth;
  CANVAS_HEIGHT = windowHeight;

  // Calculate scale factor based on a reference resolution
  const REFERENCE_WIDTH = 400;
  const REFERENCE_HEIGHT = 600;
  const widthRatio = CANVAS_WIDTH / REFERENCE_WIDTH;
  const heightRatio = CANVAS_HEIGHT / REFERENCE_HEIGHT;
  currentScaleFactor = Math.min(widthRatio, heightRatio);

  // Scale other constants
  CANNON_WIDTH = Math.floor(50 * currentScaleFactor);
  CANNON_HEIGHT = Math.floor(30 * currentScaleFactor);
  BULLET_SPEED = Math.floor(10 * currentScaleFactor);
  MIN_BALL_RADIUS = Math.floor(30 * currentScaleFactor);
  MAX_BALL_RADIUS = Math.floor(50 * currentScaleFactor);
  MIN_SPLIT_RADIUS = Math.floor(20 * currentScaleFactor);
}

// Main game setup
function setup() {
  // Calculate responsive dimensions
  calculateDimensions();

  // Create canvas that fills the entire screen
  let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.style("display", "block");

  // Position at the top-left corner (0,0)
  canvas.position(0, 0);

  // Initialize background
  initBackground();

  textFont("Arial");

  // Start with splash screen
  gameState = "SPLASH";
  splashStartTime = millis();
  transitionPos = 0;
}

// Handle window resize
function windowResized() {
  // Recalculate dimensions
  calculateDimensions();

  // Resize the canvas to fill the screen
  resizeCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Reposition the canvas at (0,0)
  canvas.position(0, 0);

  // Resize background
  resizeBackground();

  // Scale existing game objects
  if (cannon) {
    cannon.resize();
  }

  // Scale balls
  for (let i = 0; i < balls.length; i++) {
    if (balls[i]) {
      balls[i].resize();
    }
  }
}

// Main game loop
function draw() {
  // Game state management
  switch (gameState) {
    case "SPLASH":
      displaySplashScreen();
      break;
    case "TRANSITION":
      drawTransition();
      break;
    case "TITLE":
      drawStaticBackground(); // Draw static background first
      drawDynamicElements(); // Draw clouds separately
      displayTitleScreen();
      break;
    case "PLAYING":
      drawStaticBackground(); // Draw static background first
      drawDynamicElements(); // Draw clouds separately
      updateGame();
      displayGame();
      break;
    case "GAME_OVER":
      drawStaticBackground(); // Draw static background first
      drawDynamicElements(); // Draw clouds separately
      displayGame();
      displayGameOverScreen();
      break;
  }
}

// Manual bullet firing with keyboard (for testing)
function keyPressed() {
  if (gameState === "PLAYING" && key === " ") {
    // Space bar fires a bullet manually
    if (cannon) {
      bullets.push(new Bullet(cannon.x));
    }
    return false;
  }
}

// Mobile and touch support
function touchMoved() {
  // Update cannon position for mobile/touch devices
  if (gameState === "PLAYING" && touches.length > 0) {
    cannon.x = constrain(
      touches[0].x,
      cannon.width / 2,
      CANVAS_WIDTH - cannon.width / 2
    );
  }
  // Prevent default behavior (scrolling)
  return false;
}

// Prevent default touch behavior to avoid scrolling
function touchStarted() {
  if (touches.length > 0) {
    mouseClicked(); // Reuse the mouseClicked function for touch
  }
  return false;
}

// Display splash screen
function displaySplashScreen() {
  // Check if splash duration has passed
  if (millis() - splashStartTime > SPLASH_DURATION) {
    // Start transition to title screen
    gameState = "TRANSITION";
    transitionPos = 0;
    return;
  }

  // Draw splash image
  if (splashImage) {
    image(splashImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    // Fallback if image fails to load
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(40 * currentScaleFactor);
    text("BALL BLASTER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

// Handle transition animation
function drawTransition() {
  // Create a clean slate for the transition
  background(0);

  // Draw splash image with leftward animation
  if (splashImage) {
    image(splashImage, -transitionPos, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Draw background and title at offset position moving in from right
  push();
  translate(CANVAS_WIDTH - transitionPos, 0);

  // Draw static background elements from buffer (no clouds)
  drawStaticBackground();

  // Draw title screen elements
  displayTitleScreen();
  pop();

  // Update transition position
  transitionPos += CANVAS_WIDTH / 60; // Complete transition in about 1 second (60 frames)

  // Check if transition is complete
  if (transitionPos >= CANVAS_WIDTH) {
    gameState = "TITLE";
  }
}

// Check for button clicks
function mouseClicked() {
  // Skip splash screen if clicked
  if (gameState === "SPLASH") {
    gameState = "TRANSITION";
    transitionPos = 0;
    return false; // Prevent default click behavior
  }

  // Skip transition if clicked
  if (gameState === "TRANSITION") {
    gameState = "TITLE";
    return false; // Prevent default click behavior
  }

  // Start button on title screen
  if (gameState === "TITLE") {
    let buttonX = CANVAS_WIDTH / 2;
    let buttonY = CANVAS_HEIGHT / 2 + 100 * currentScaleFactor;
    let buttonWidth = 120 * currentScaleFactor;
    let buttonHeight = 50 * currentScaleFactor;

    if (
      mouseX > buttonX - buttonWidth / 2 &&
      mouseX < buttonX + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      startGame();
      return false; // Prevent default click behavior
    }
  }

  // Restart button on game over screen
  else if (gameState === "GAME_OVER") {
    let buttonY = CANVAS_HEIGHT * 0.78; // Match the same position as in game.js
    let buttonWidth = 170 * currentScaleFactor; // Match the same width as in game.js
    let buttonHeight = 50 * currentScaleFactor;

    if (
      mouseX > CANVAS_WIDTH / 2 - buttonWidth / 2 &&
      mouseX < CANVAS_WIDTH / 2 + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      // Reset game over animation variables (these are in game.js)
      if (typeof gameOverOpacity !== "undefined") {
        gameOverOpacity = 0;
        gameOverTitleScale = 0;
        gameOverScoreReveal = 0;
        gameOverLevelReveal = 0;
        gameOverButtonScale = 0;
      }

      startGame();
      return false; // Prevent default click behavior
    }
  }

  return false; // Prevent default click behavior
}
