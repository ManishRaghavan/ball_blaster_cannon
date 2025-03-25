// Game states and management
function startGame() {
  // Reset game variables
  cannon = new Cannon();
  balls = [];
  bullets = [];
  score = 0;
  level = 1;
  gameOver = false;
  fireRate = INITIAL_FIRE_RATE;
  bulletPower = INITIAL_BULLET_POWER;

  // We don't need to set lastBulletTime anymore as it's handled by the cannon

  // Create initial balls
  createNewBalls();

  // Set game state to playing
  gameState = "PLAYING";
}

function createNewBalls() {
  // Clear existing balls
  balls = [];

  // Determine number of balls based on level
  let numBalls = 2 + Math.min(level, 6); // Cap at 8 balls maximum

  // Create balls with varied sizes
  for (let i = 0; i < numBalls; i++) {
    // Custom starting parameters for more controlled initial positions
    const radius = random(MIN_BALL_RADIUS, MAX_BALL_RADIUS);

    // Spread balls horizontally across the screen
    const xSegment = CANVAS_WIDTH / (numBalls + 1);
    const x = xSegment * (i + 1) + random(-xSegment / 3, xSegment / 3);

    // Start balls higher on the screen, accounting for the 100px bottom margin
    const maxY = CANVAS_HEIGHT - 100 - radius * 3; // Keep a good distance from the bottom margin
    const minY = radius * 2;
    // Make balls start higher and with more level spacing to give player more time
    const startY =
      random(minY, maxY * 0.3) - (level - 1) * 50 * currentScaleFactor;
    const y = constrain(startY, minY, maxY);

    // Create and add the ball
    const newBall = new Ball(x, y, radius, undefined);

    // Give a small initial vertical velocity for smoother start
    // Use even slower initial velocity for easier gameplay
    newBall.dy = random(0.1, 0.5) * currentScaleFactor;

    // Make health scale with level but with balanced values
    // Bigger balls have more health but not too much
    const sizeRatio = radius / MAX_BALL_RADIUS;
    newBall.health = floor(random(2, 5) * level * sizeRatio);
    newBall.originalHealth = newBall.health;

    balls.push(newBall);
  }
}

function updateGame() {
  // Update cannon position
  if (cannon) {
    cannon.update(); // This now includes firing bullets
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    // Update bullet position
    bullets[i].update();

    // Check if bullet is off-screen
    if (bullets[i].isOffScreen()) {
      bullets.splice(i, 1);
      continue;
    }

    // Check for collisions with balls
    for (let j = balls.length - 1; j >= 0; j--) {
      if (bullets[i] && bullets[i].checkCollision(balls[j])) {
        // Record the ball's position and radius before it might be removed
        let blastX = balls[j].x;
        let blastY = balls[j].y;
        let blastRadius = balls[j].radius;

        // Handle normal ball hit
        const damage = bullets[i].damage;
        const newBalls = balls[j].hit(damage);

        // Add visual score indicator at bullet impact position
        awardPoints(damage, blastX, blastY);

        // Remove ball if needed
        if (newBalls !== null) {
          // Reward more points for ball destruction (since we no longer have split balls)
          const ballSizeBonus = floor((balls[j].radius / MIN_BALL_RADIUS) * 10);
          const destroyPoints = 25 + ballSizeBonus;

          // Use awardPoints with destruction bonus
          awardPoints(destroyPoints, blastX, blastY, { r: 255, g: 200, b: 50 });

          // Remove destroyed ball
          balls.splice(j, 1);
        }

        // Remove the bullet that hit
        bullets.splice(i, 1);
        break;
      }
    }
  }

  // Update balls
  for (let i = balls.length - 1; i >= 0; i--) {
    // Regular ball update
    balls[i].update();

    // Check collision with cannon
    if (cannon && cannon.checkCollision(balls[i])) {
      gameOver = true;
      gameState = "GAME_OVER";
      break;
    }
  }

  // Check if level is complete
  if (balls.length === 0) {
    // Create level up celebration effect
    for (let i = 0; i < 20; i++) {
      // Create particles around the screen for level completion
      const x = random(CANVAS_WIDTH * 0.2, CANVAS_WIDTH * 0.8);
      const y = random(CANVAS_HEIGHT * 0.2, CANVAS_HEIGHT * 0.6);

      // Create celebration particles
      particles.push(
        new BlastParticle(x, y, 30 * currentScaleFactor, {
          r: random(100, 255),
          g: random(150, 255),
          b: random(50, 200),
        })
      );
    }

    // Increase level
    level++;

    // Create "LEVEL UP" text in the center
    addFloatingText(
      "LEVEL " + level,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      { r: 255, g: 230, b: 50 },
      2000,
      40 * currentScaleFactor
    );

    // Create new balls for the next level
    createNewBalls();
  }
}

function displayGame() {
  // Don't clear background since we're drawing our custom background first
  // background(240); -- removing this line

  // Draw game elements
  displayUI();

  // Display cannon
  if (cannon) {
    cannon.display();
  }

  // Display bullets - use direct drawing for reliability
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i]) {
      bullets[i].display();
    }
  }

  // Display balls
  for (let i = 0; i < balls.length; i++) {
    if (balls[i]) {
      balls[i].display();
    }
  }

  // Display particle effects on top
  updateParticles();
}

// UI animation variables
let scoreDisplay = 0; // For score animation
let levelDisplay = 1; // For level animation
let scoreScale = 1; // For score pop effect
let scoreColor = { r: 255, g: 255, b: 255 }; // Score color
let scoreFlashTime = 0; // For score flash effect
let scoreGlowAmount = 0; // For score glow effect
let levelUpTime = 0; // For level up animation
let levelScale = 1; // For level pop effect
let floatingScores = []; // Array to hold floating score indicators

// Update UI animations
function updateUIAnimations() {
  // Animate score number
  if (scoreDisplay < score) {
    // Animate score counting up
    let diff = score - scoreDisplay;
    scoreDisplay += max(1, ceil(diff * 0.1)); // Smooth count-up animation

    // Add pop effect
    scoreScale = 1.2;

    // Add color flash
    scoreColor = { r: 255, g: 255, b: 150 };
    scoreFlashTime = millis() + 500;
    scoreGlowAmount = 15; // Add glow when score increases
  } else {
    scoreDisplay = score; // Ensure exact match
  }

  // Animate level number
  if (levelDisplay < level) {
    levelDisplay = level;
    // Add level-up flash effect
    levelUpTime = millis() + 2000;
    levelScale = 1.5;
    // Create level-up floating text
    addFloatingText(
      "LEVEL UP!",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 3,
      { r: 255, g: 255, b: 50 },
      2000,
      30 * currentScaleFactor
    );
  }

  // Scale animation for score
  if (scoreScale > 1) {
    scoreScale = lerp(scoreScale, 1, 0.1);
  }

  // Scale animation for level
  if (levelScale > 1) {
    levelScale = lerp(levelScale, 1, 0.05);
  }

  // Color animation
  if (
    millis() > scoreFlashTime &&
    (scoreColor.r !== 255 || scoreColor.g !== 255 || scoreColor.b !== 255)
  ) {
    scoreColor.r = lerp(scoreColor.r, 255, 0.1);
    scoreColor.g = lerp(scoreColor.g, 255, 0.1);
    scoreColor.b = lerp(scoreColor.b, 255, 0.1);
  }

  // Glow decay
  if (scoreGlowAmount > 0) {
    scoreGlowAmount *= 0.9;
  }

  // Update floating scores
  updateFloatingScores();
}

// Add a floating score indicator
function addScoreIndicator(points, x, y, color) {
  floatingScores.push({
    text: "+" + points,
    x: x,
    y: y,
    vy: -2 * currentScaleFactor, // Move upward
    alpha: 255,
    scale: 1.2,
    color: color || { r: 255, g: 255, b: 255 },
    creationTime: millis(),
    lifetime: 1000, // 1 second lifetime
  });
}

// Add generic floating text
function addFloatingText(text, x, y, color, lifetime, size) {
  floatingScores.push({
    text: text,
    x: x,
    y: y,
    vy: -1 * currentScaleFactor, // Slow upward movement
    alpha: 255,
    scale: 1.5,
    color: color || { r: 255, g: 255, b: 255 },
    creationTime: millis(),
    lifetime: lifetime || 1500, // 1.5 seconds default lifetime
    size: size || 20 * currentScaleFactor, // Size parameter
  });
}

// Update floating score indicators
function updateFloatingScores() {
  for (let i = floatingScores.length - 1; i >= 0; i--) {
    let fs = floatingScores[i];

    // Update position
    fs.y += fs.vy;

    // Update appearance
    const age = millis() - fs.creationTime;
    const lifePercent = age / fs.lifetime;
    fs.alpha = map(lifePercent, 0, 1, 255, 0);
    fs.scale = map(lifePercent, 0, 0.3, 1.5, 1); // Quick scale down then hold

    // Remove if expired
    if (age > fs.lifetime) {
      floatingScores.splice(i, 1);
    }
  }
}

// Draw floating score indicators
function drawFloatingScores() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();

  for (let fs of floatingScores) {
    // Set shadow for glow effect
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = `rgba(${fs.color.r}, ${fs.color.g}, ${fs.color.b}, 0.5)`;

    fill(fs.color.r, fs.color.g, fs.color.b, fs.alpha);
    textSize(fs.size || 18 * currentScaleFactor);
    textStyle(BOLD);

    push();
    translate(fs.x, fs.y);
    scale(fs.scale);
    text(fs.text, 0, 0);
    pop();
  }

  // Reset shadow
  drawingContext.shadowBlur = 0;
  pop();
}

function displayUI() {
  // Update UI animations
  updateUIAnimations();

  push();

  // Set up shadow and glow effects for text
  if (scoreGlowAmount > 0) {
    drawingContext.shadowBlur = scoreGlowAmount;
    drawingContext.shadowColor = `rgba(255, 220, 50, 0.7)`;
  }

  // Score display
  textAlign(LEFT, TOP);
  let uiTextSize = max(16, 24 * currentScaleFactor);

  // Score label
  fill(200, 200, 230);
  textSize(uiTextSize * 0.7);
  text("SCORE", 15 * currentScaleFactor, 15 * currentScaleFactor);

  // Score value with scale effect
  push();
  translate(
    15 * currentScaleFactor,
    15 * currentScaleFactor + uiTextSize * 0.9
  );
  scale(scoreScale);
  fill(scoreColor.r, scoreColor.g, scoreColor.b);
  textSize(uiTextSize);
  textStyle(BOLD);
  text(scoreDisplay, 0, 0);
  textStyle(NORMAL);
  pop();

  // Reset shadow
  drawingContext.shadowBlur = 0;

  // Level display with custom styling
  let levelY = 20 * currentScaleFactor + uiTextSize * 2;

  // Level badge - add pulsating effect when level up
  let levelPulse = 0;
  if (millis() < levelUpTime) {
    levelPulse = sin(millis() * 0.01) * 20; // Pulsating effect
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = "rgba(255, 255, 100, 0.7)";
  }

  // Level badge background with glow on level up
  fill(80, 100, 180, 200);
  strokeWeight(2 * currentScaleFactor);
  stroke(150, 180, 230);
  let badgeWidth = 110 * currentScaleFactor;
  let badgeHeight = 36 * currentScaleFactor;
  rect(
    15 * currentScaleFactor,
    levelY,
    badgeWidth,
    badgeHeight,
    badgeHeight / 2,
    badgeHeight / 2,
    badgeHeight / 2,
    10
  );

  // Level text
  textAlign(CENTER, CENTER);
  fill(220, 220, 255);
  textSize(uiTextSize * 0.7);
  textStyle(NORMAL);
  text(
    "LEVEL",
    15 * currentScaleFactor + badgeWidth * 0.35,
    levelY + badgeHeight / 2 - 1
  );

  // Level number with scaling animation
  push();
  translate(
    15 * currentScaleFactor + badgeWidth * 0.75,
    levelY + badgeHeight / 2
  );
  scale(levelScale);

  // Special color for level up
  if (millis() < levelUpTime) {
    // Cycle through colors during level up
    let cycle = (millis() % 500) / 500;
    fill(255, 255 * (0.5 + 0.5 * sin(cycle * PI * 2)), 100);
  } else {
    fill(255, 255, 255);
  }

  textSize(uiTextSize * 0.9);
  textStyle(BOLD);
  text(levelDisplay, 0, 0);
  pop();

  textStyle(NORMAL);
  drawingContext.shadowBlur = 0;

  // Draw floating scores on top
  drawFloatingScores();

  pop();
}

function displayTitleScreen() {
  // Don't clear background since we're drawing our custom background first
  // background(240); -- removing this line

  push();
  // Title
  textAlign(CENTER, CENTER);
  fill(30, 30, 120);
  textSize(40 * currentScaleFactor);

  // Instructions
  textSize(20 * currentScaleFactor);
  fill(0);
  text(
    "Move the cannon left/right to hit the balls",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2
  );
  text(
    "Destroy all balls before they hit you",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2 + 30 * currentScaleFactor
  );

  // Start button - updated to match play again button style
  let buttonWidth = 170 * currentScaleFactor;
  let buttonHeight = 50 * currentScaleFactor;
  let buttonY = CANVAS_HEIGHT / 2 + 100 * currentScaleFactor;

  // Check if mouse is over button
  let buttonHover =
    mouseX > CANVAS_WIDTH / 2 - buttonWidth / 2 &&
    mouseX < CANVAS_WIDTH / 2 + buttonWidth / 2 &&
    mouseY > buttonY - buttonHeight / 2 &&
    mouseY < buttonY + buttonHeight / 2;

  // Button glow effect
  if (buttonHover) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = "rgba(100, 255, 100, 0.8)";
  } else {
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(100, 200, 100, 0.5)";
  }

  // Draw button
  push();
  translate(CANVAS_WIDTH / 2, buttonY);

  // Button background with gradient
  let btnGradient = drawingContext.createLinearGradient(
    0,
    -buttonHeight / 2,
    0,
    buttonHeight / 2
  );
  btnGradient.addColorStop(0, "rgb(70, 190, 70)");
  btnGradient.addColorStop(1, "rgb(40, 150, 40)");
  drawingContext.fillStyle = btnGradient;

  rectMode(CENTER);
  rect(0, 0, buttonWidth, buttonHeight, 10 * currentScaleFactor);

  // Button border
  stroke(100, 255, 100, 150);
  strokeWeight(2 * currentScaleFactor);
  rect(0, 0, buttonWidth, buttonHeight, 10 * currentScaleFactor);

  // Button text
  fill(255);
  noStroke();
  textSize(24 * currentScaleFactor);
  textStyle(BOLD);
  text("START", 0, 2);

  pop();

  // Add arrow indicators on hover
  if (buttonHover) {
    let arrowOffset = 5 * sin(millis() * 0.01);
    fill(255, 255, 255, 200);
    noStroke();

    // Left arrow
    push();
    translate(CANVAS_WIDTH / 2 - buttonWidth / 2 - 15 - arrowOffset, buttonY);
    beginShape();
    vertex(0, 0);
    vertex(-10 * currentScaleFactor, -10 * currentScaleFactor);
    vertex(-10 * currentScaleFactor, 10 * currentScaleFactor);
    endShape(CLOSE);
    pop();

    // Right arrow
    push();
    translate(CANVAS_WIDTH / 2 + buttonWidth / 2 + 15 + arrowOffset, buttonY);
    beginShape();
    vertex(0, 0);
    vertex(10 * currentScaleFactor, -10 * currentScaleFactor);
    vertex(10 * currentScaleFactor, 10 * currentScaleFactor);
    endShape(CLOSE);
    pop();
  }

  // Reset shadow
  drawingContext.shadowBlur = 0;

  pop();
}

// Game over screen animation variables
let gameOverOpacity = 0;
let gameOverTitleScale = 0;
let gameOverScoreReveal = 0;
let gameOverLevelReveal = 0;
let gameOverButtonScale = 0;
let gameOverButtonHover = false;
let gameOverGlowAmount = 0;
let gameOverStars = [];

function initGameOverEffects() {
  // Reset animation variables
  gameOverOpacity = 0;
  gameOverTitleScale = 0;
  gameOverScoreReveal = 0;
  gameOverLevelReveal = 0;
  gameOverButtonScale = 0;
  gameOverGlowAmount = 20;
  gameOverStars = [];

  // Create star particles
  for (let i = 0; i < 30; i++) {
    createGameOverStar(random(CANVAS_WIDTH), random(CANVAS_HEIGHT));
  }
}

function createGameOverStar(x, y) {
  gameOverStars.push({
    x: x,
    y: y,
    size: random(2, 6) * currentScaleFactor,
    alpha: random(100, 255),
    twinkleSpeed: random(0.03, 0.1),
    twinkleOffset: random(TWO_PI),
    color: {
      r: random(200, 255),
      g: random(200, 255),
      b: random(230, 255),
    },
  });
}

function displayGameOverScreen() {
  // Initialize game over effects if this is the first frame
  if (gameOverOpacity === 0) {
    initGameOverEffects();
  }

  push();

  // Gradually fade in the overlay
  gameOverOpacity = min(gameOverOpacity + 5, 200);

  // Semi-transparent overlay with gradient
  noStroke();
  let overlayColor1 = color(20, 10, 40, gameOverOpacity);
  let overlayColor2 = color(60, 10, 80, gameOverOpacity);

  // Create gradient overlay
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    let inter = map(y, 0, CANVAS_HEIGHT, 0, 1);
    let c = lerpColor(overlayColor1, overlayColor2, inter);
    stroke(c);
    line(0, y, CANVAS_WIDTH, y);
  }

  // Update and draw stars
  updateAndDrawGameOverStars();

  // Gradually reveal title
  gameOverTitleScale = min(gameOverTitleScale + 0.05, 1);

  // Game over title with glow effect
  textAlign(CENTER, CENTER);
  let titleY = CANVAS_HEIGHT * 0.22; // Moved up slightly

  if (gameOverTitleScale > 0) {
    // Title shadow/glow
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = "rgba(255, 50, 50, 0.8)";

    push();
    translate(CANVAS_WIDTH / 2, titleY);
    scale(gameOverTitleScale);

    // Main title with fire-like effect - simplify to one layer to avoid stacking
    let flameOffset = millis() * 0.001;
    let flameColor = color(
      255,
      50 + 40 * sin(flameOffset),
      50 * sin(flameOffset * 0.5)
    );
    fill(flameColor);
    textSize(56 * currentScaleFactor);
    textStyle(BOLD);
    text("GAME OVER", 0, 0);

    pop();

    // Reset shadow
    drawingContext.shadowBlur = 0;
  }

  // Gradually reveal score
  gameOverScoreReveal = min(gameOverScoreReveal + 0.02, 1);

  if (gameOverScoreReveal > 0) {
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(255, 220, 100, 0.7)";

    let scoreY = CANVAS_HEIGHT * 0.4; // More spacing between title and score

    // Score label with more space
    fill(200, 200, 255, 255 * gameOverScoreReveal);
    textSize(20 * currentScaleFactor);
    textStyle(NORMAL);
    text("FINAL SCORE", CANVAS_WIDTH / 2, scoreY - 35 * currentScaleFactor);

    // Score value with counter animation
    let displayScore = floor(score * gameOverScoreReveal);
    fill(255, 255, 150, 255 * gameOverScoreReveal);
    textSize(44 * currentScaleFactor);
    textStyle(BOLD);
    text(displayScore, CANVAS_WIDTH / 2, scoreY);

    // Score rank text based on score value
    let rankText = "";
    let rankColor = color(255, 255, 255);

    if (score < 100) {
      rankText = "ROOKIE";
      rankColor = color(150, 150, 255);
    } else if (score < 500) {
      rankText = "NOVICE";
      rankColor = color(100, 255, 100);
    } else if (score < 1000) {
      rankText = "SHARP SHOOTER";
      rankColor = color(255, 200, 0);
    } else if (score < 2000) {
      rankText = "MASTER BLASTER";
      rankColor = color(255, 100, 100);
    } else {
      rankText = "LEGENDARY";
      rankColor = color(255, 50, 200);
    }

    // Show rank once score is fully revealed
    if (gameOverScoreReveal > 0.9) {
      push();
      let rankAlpha = map(gameOverScoreReveal, 0.9, 1, 0, 255);
      rankColor.setAlpha(rankAlpha);
      fill(rankColor);
      textSize(24 * currentScaleFactor);

      // Add pulsating effect to rank text
      let pulseFactor = 1 + 0.1 * sin(millis() * 0.005);
      scale(pulseFactor);
      text(
        rankText,
        CANVAS_WIDTH / 2 / pulseFactor,
        (scoreY + 48 * currentScaleFactor) / pulseFactor
      );
      pop();
    }
  }

  // Gradually reveal level
  gameOverLevelReveal = min(gameOverLevelReveal + 0.025, 1);

  if (gameOverLevelReveal > 0) {
    let levelY = CANVAS_HEIGHT * 0.58; // Increased spacing between score and level

    // Create shine effect across text
    let shinePosition = (millis() % 2000) / 2000;

    // Level label and value
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = "rgba(100, 200, 255, 0.7)";

    fill(150, 200, 255, 255 * gameOverLevelReveal);
    textSize(18 * currentScaleFactor);
    textStyle(NORMAL);
    text("LEVEL REACHED", CANVAS_WIDTH / 2, levelY - 28 * currentScaleFactor);

    // Level number with shine effect
    let displayLevel = floor(level * gameOverLevelReveal);
    textSize(34 * currentScaleFactor);
    textStyle(BOLD);

    // Draw level text with shine effect
    let levelText = displayLevel.toString();
    let levelTextWidth = textWidth(levelText);

    // Base level text
    fill(255, 255, 255, 255 * gameOverLevelReveal);
    text(levelText, CANVAS_WIDTH / 2, levelY);

    // Shine effect overlay
    if (gameOverLevelReveal > 0.9) {
      drawingContext.save();
      drawingContext.clip();

      let shineX = map(
        shinePosition,
        0,
        1,
        CANVAS_WIDTH / 2 - levelTextWidth / 2 - 50,
        CANVAS_WIDTH / 2 + levelTextWidth / 2 + 50
      );

      let gradient = drawingContext.createLinearGradient(
        shineX - 20,
        0,
        shineX + 20,
        0
      );

      gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      drawingContext.fillStyle = gradient;
      drawingContext.fillRect(
        CANVAS_WIDTH / 2 - levelTextWidth / 2 - 50,
        levelY - 24,
        levelTextWidth + 100,
        48
      );

      drawingContext.restore();
    }
  }

  // Play again button
  gameOverButtonScale = min(gameOverButtonScale + 0.03, 1);

  if (gameOverButtonScale > 0) {
    let buttonY = CANVAS_HEIGHT * 0.78; // Match the new position
    let buttonWidth = 170 * currentScaleFactor; // Match the new width
    let buttonHeight = 50 * currentScaleFactor;

    // Check if mouse is over button
    gameOverButtonHover =
      mouseX > CANVAS_WIDTH / 2 - buttonWidth / 2 &&
      mouseX < CANVAS_WIDTH / 2 + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2;

    // Button glow effect
    if (gameOverButtonHover) {
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = "rgba(100, 255, 100, 0.8)";
      gameOverButtonScale = 1.05; // Slight scale up on hover
    } else {
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = "rgba(100, 200, 100, 0.5)";
    }

    // Draw button
    push();
    translate(CANVAS_WIDTH / 2, buttonY);
    scale(gameOverButtonScale);

    // Button background with gradient
    let btnGradient = drawingContext.createLinearGradient(
      0,
      -buttonHeight / 2,
      0,
      buttonHeight / 2
    );
    btnGradient.addColorStop(0, "rgb(70, 190, 70)");
    btnGradient.addColorStop(1, "rgb(40, 150, 40)");
    drawingContext.fillStyle = btnGradient;

    rectMode(CENTER);
    rect(0, 0, buttonWidth, buttonHeight, 10 * currentScaleFactor);

    // Button border
    stroke(100, 255, 100, 150);
    strokeWeight(2 * currentScaleFactor);
    rect(0, 0, buttonWidth, buttonHeight, 10 * currentScaleFactor);

    // Button text with proper padding
    fill(255);
    noStroke();
    textSize(24 * currentScaleFactor);
    textStyle(BOLD);
    text("PLAY AGAIN", 0, 2);

    pop();

    // Add arrow indicators on hover
    if (gameOverButtonHover) {
      let arrowOffset = 5 * sin(millis() * 0.01);
      fill(255, 255, 255, 200);
      noStroke();

      // Left arrow
      push();
      translate(CANVAS_WIDTH / 2 - buttonWidth / 2 - 15 - arrowOffset, buttonY);
      beginShape();
      vertex(0, 0);
      vertex(-10 * currentScaleFactor, -10 * currentScaleFactor);
      vertex(-10 * currentScaleFactor, 10 * currentScaleFactor);
      endShape(CLOSE);
      pop();

      // Right arrow
      push();
      translate(CANVAS_WIDTH / 2 + buttonWidth / 2 + 15 + arrowOffset, buttonY);
      beginShape();
      vertex(0, 0);
      vertex(10 * currentScaleFactor, -10 * currentScaleFactor);
      vertex(10 * currentScaleFactor, 10 * currentScaleFactor);
      endShape(CLOSE);
      pop();
    }
  }

  pop();
}

function updateAndDrawGameOverStars() {
  // Update and draw background stars
  for (let star of gameOverStars) {
    // Twinkle effect
    let twinkleAmount = sin(millis() * star.twinkleSpeed + star.twinkleOffset);
    let displayAlpha = map(twinkleAmount, -1, 1, star.alpha * 0.5, star.alpha);

    // Draw star
    drawingContext.shadowBlur = 5;
    drawingContext.shadowColor = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, 0.5)`;

    fill(star.color.r, star.color.g, star.color.b, displayAlpha);

    if (random() < 0.002) {
      // Rare big sparkle
      star.size = random(5, 8) * currentScaleFactor;
    }

    circle(star.x, star.y, star.size);
  }

  drawingContext.shadowBlur = 0;
}

// Check for button clicks
function mouseClicked() {
  // Start button on title screen
  if (gameState === "TITLE") {
    let buttonY = CANVAS_HEIGHT / 2 + 100 * currentScaleFactor;
    let buttonWidth = 170 * currentScaleFactor;
    let buttonHeight = 50 * currentScaleFactor;

    if (
      mouseX > CANVAS_WIDTH / 2 - buttonWidth / 2 &&
      mouseX < CANVAS_WIDTH / 2 + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      startGame();
      return false; // Prevent default click behavior
    }
  }

  // Restart button on game over screen
  else if (gameState === "GAME_OVER") {
    let buttonY = CANVAS_HEIGHT * 0.78; // Match the new position
    let buttonWidth = 170 * currentScaleFactor; // Match the new width
    let buttonHeight = 50 * currentScaleFactor;

    if (
      mouseX > CANVAS_WIDTH / 2 - buttonWidth / 2 &&
      mouseX < CANVAS_WIDTH / 2 + buttonWidth / 2 &&
      mouseY > buttonY - buttonHeight / 2 &&
      mouseY < buttonY + buttonHeight / 2
    ) {
      // Reset game over animation variables
      gameOverOpacity = 0;
      gameOverTitleScale = 0;
      gameOverScoreReveal = 0;
      gameOverLevelReveal = 0;
      gameOverButtonScale = 0;

      // Start a new game
      startGame();
      return false; // Prevent default click behavior
    }
  }

  return true;
}

// Particle system for visual effects
let particles = [];

// Create visual blast effect
function createBlastEffect(x, y, radius) {
  // Create particles for explosion effect
  const numParticles = floor(30 * currentScaleFactor);

  for (let i = 0; i < numParticles; i++) {
    particles.push(new BlastParticle(x, y, radius));
  }
}

// Update particles
function updateParticles() {
  // Update existing particles
  for (let i = particles.length - 1; i >= 0; i--) {
    // Update particle and check if it's still alive
    const isAlive = particles[i].update();

    // Remove dead particles
    if (!isAlive) {
      particles.splice(i, 1);
    } else {
      // Display particle
      particles[i].display();
    }
  }
}

// Particle class for blast effect
class BlastParticle {
  constructor(x, y, radius, customColor) {
    this.x = x;
    this.y = y;
    this.size = random(5, 15) * currentScaleFactor;
    this.alpha = 255;
    this.lifespan = random(20, 40);
    this.age = 0;

    // Random direction
    let angle = random(TWO_PI);
    let speed = random(1, 5) * currentScaleFactor;
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;

    // Use custom color if provided, otherwise generate random warm colors
    if (customColor) {
      this.r = customColor.r;
      this.g = customColor.g;
      this.b = customColor.b;
    } else {
      // Random color - oranges, reds, yellows for default explosion
      this.r = random(200, 255);
      this.g = random(100, 200);
      this.b = random(0, 50);
    }

    // Add slight glow/halo effect
    this.glowSize = this.size * 1.5;
    this.glowAlpha = 100;
  }

  update() {
    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Add gravity
    this.vy += 0.1 * currentScaleFactor;

    // Age the particle
    this.age++;

    // Decrease alpha based on age percentage
    this.alpha = map(this.age, 0, this.lifespan, 255, 0);
    this.glowAlpha = map(this.age, 0, this.lifespan, 100, 0);

    // Return true if still alive
    return this.age < this.lifespan;
  }

  display() {
    noStroke();

    // Draw glow/halo effect
    fill(this.r, this.g, this.b, this.glowAlpha);
    circle(this.x, this.y, this.glowSize);

    // Draw main particle
    fill(this.r, this.g, this.b, this.alpha);
    circle(this.x, this.y, this.size);

    // Draw bright core
    fill(255, 255, 255, this.alpha * 0.7);
    circle(this.x, this.y, this.size * 0.5);
  }
}

// Call this when score increases
function awardPoints(points, x, y, color) {
  score += points;

  // Create a floating score indicator
  const scoreColors = [
    { r: 255, g: 255, b: 150 }, // Small score
    { r: 255, g: 200, b: 50 }, // Medium score
    { r: 255, g: 150, b: 50 }, // Large score
    { r: 255, g: 100, b: 50 }, // Huge score
  ];

  let colorIndex = 0;
  if (points >= 20) colorIndex = 3;
  else if (points >= 10) colorIndex = 2;
  else if (points >= 5) colorIndex = 1;

  addScoreIndicator(
    points,
    x || CANVAS_WIDTH / 2,
    y || CANVAS_HEIGHT / 2,
    color || scoreColors[colorIndex]
  );
}
