# Ball Blast Game - Complete Implementation Guide

## Table of Contents

1. [Game Overview](#game-overview)
2. [Game Mechanics](#game-mechanics)
3. [Technical Implementation](#technical-implementation)
4. [Complete Code Reference](#complete-code-reference)
5. [Extension Ideas](#extension-ideas)
6. [Implementation Checklist](#implementation-checklist)

## Game Overview

Ball Blast is an arcade-style game where the player controls a cannon at the bottom of the screen. The cannon automatically fires bullets upward to destroy numbered balls that bounce around the screen. The goal is to destroy all balls before they hit the cannon.

### Core Gameplay Loop

1. Control a cannon at the bottom of the screen
2. Shoot automatically at bouncing balls with numbers
3. Reduce ball numbers with your shots
4. Split balls when their numbers reach zero
5. Advance levels when all balls are destroyed
6. Game over when a ball hits your cannon

## Game Mechanics

### Cannon

- **Movement**: Controlled by mouse/touch position (horizontal only)
- **Shooting**: Automatic at a fixed rate (configurable)
- **Size**: Default dimensions of 50×30 pixels
- **Collision**: Game ends if a ball hits the cannon

### Balls

- **Appearance**: Circular with a number displayed inside
- **Number**: Represents the ball's health/hit points
- **Movement**: Affected by gravity, bounces off walls and floor
- **Initial Size**: Random radius between 30-50 pixels
- **Initial Health**: Random value × current level
- **Splitting**: When health reaches zero, splits into two smaller balls (if radius is large enough)
- **Destruction**: Completely destroyed when health reaches zero and radius is too small to split

### Bullets

- **Firing Rate**: Default 10 bullets per second
- **Movement**: Travel upward at constant speed
- **Damage**: Reduce ball health by 1 (or more with power-ups)
- **Removal**: Disappear after hitting a ball or when going off-screen

### Physics

- **Gravity**: Constant downward force on balls
- **Bounce**: Balls bounce off walls and floor with elasticity
- **Collision Detection**: Circle-rectangle for ball-cannon, circle-point for ball-bullet

### Level Progression

- **Next Level**: Triggered when all balls are destroyed
- **Difficulty Scaling**: Each level increases:
  - Number of balls
  - Ball health
  - Ball speed (optional)
- **Level Display**: Current level shown on screen

### Scoring System

- **Points**: 1 point per point of damage dealt to balls
- **Score Display**: Current score shown on screen
- **High Score**: Optional persistence between sessions

### Game States

- **Title Screen**: Optional with game title and "Start" button
- **Playing**: Main gameplay state
- **Game Over**: Shows final score and "Restart" option
- **Level Transition**: Optional brief display between levels

## Technical Implementation

### Project Structure

```
ball-blast/
├── index.html         # Main HTML file
├── style.css          # CSS styling
├── js/
│   ├── main.js        # Main game setup and loop
│   ├── cannon.js      # Cannon class
│   ├── ball.js        # Ball class
│   ├── bullet.js      # Bullet class
│   └── game.js        # Game state management
```

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ball Blast Cannin</title>
    <link rel="stylesheet" href="style.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
  </head>
  <body>
    <script src="js/cannon.js"></script>
    <script src="js/ball.js"></script>
    <script src="js/bullet.js"></script>
    <script src="js/game.js"></script>
    <script src="js/main.js"></script>
  </body>
</html>
```

### CSS Styling

```css
body {
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f0f0;
  overflow: hidden;
}

canvas {
  display: block;
  border: 2px solid #333;
}
```

### Core Game Architecture

#### Game Constants

```javascript
// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.2;
const BOUNCE_DAMPENING = 0.9;
const INITIAL_FIRE_RATE = 10;
const INITIAL_BULLET_POWER = 1;
const CANNON_WIDTH = 50;
const CANNON_HEIGHT = 30;
const BULLET_SPEED = 10;
const MIN_BALL_RADIUS = 30;
const MAX_BALL_RADIUS = 50;
const MIN_SPLIT_RADIUS = 20;
```

#### Game Variables

```javascript
// Game variables
let cannon;
let balls = [];
let bullets = [];
let score = 0;
let gameOver = false;
let level = 1;
let fireRate = INITIAL_FIRE_RATE;
let bulletPower = INITIAL_BULLET_POWER;
let lastBulletTime = 0;
let gameState = "TITLE"; // 'TITLE', 'PLAYING', 'GAME_OVER'
```

## Complete Code Reference

### Cannon Class (cannon.js)

```javascript
class Cannon {
  constructor() {
    this.width = CANNON_WIDTH;
    this.height = CANNON_HEIGHT;
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT - this.height / 2;
  }

  update() {
    // Move cannon based on mouse/touch position
    this.x = constrain(mouseX, this.width / 2, CANVAS_WIDTH - this.width / 2);
  }

  display() {
    // Draw the cannon base
    fill(50);
    rectMode(CENTER);
    rect(this.x, this.y, this.width, this.height, 5);

    // Draw the cannon barrel
    fill(70);
    rect(this.x, this.y - this.height / 2 - 10, 16, 20, 3);
  }

  checkCollision(ball) {
    // Check if the ball hits the cannon
    // Using simplified circle-rectangle collision
    let testX = ball.x;
    let testY = ball.y;

    // Find closest point on rectangle
    if (ball.x < this.x - this.width / 2) testX = this.x - this.width / 2;
    else if (ball.x > this.x + this.width / 2) testX = this.x + this.width / 2;
    if (ball.y < this.y - this.height / 2) testY = this.y - this.height / 2;
    else if (ball.y > this.y + this.height / 2)
      testY = this.y + this.height / 2;

    // Calculate distance
    let distance = dist(ball.x, ball.y, testX, testY);

    // Check if distance is less than radius
    return distance <= ball.radius;
  }
}
```

### Ball Class (ball.js)

```javascript
class Ball {
  constructor(x, y, radius, health) {
    // Position
    this.x = x !== undefined ? x : random(radius, CANVAS_WIDTH - radius);
    this.y = y !== undefined ? y : radius * 2;

    // Size and health
    this.radius =
      radius !== undefined ? radius : random(MIN_BALL_RADIUS, MAX_BALL_RADIUS);
    this.health = health !== undefined ? health : floor(random(5, 15) * level);
    this.originalHealth = this.health;

    // Movement
    this.dx = random(1, 3) * (random() > 0.5 ? 1 : -1);
    this.dy = 0;

    // Physics
    this.gravity = GRAVITY;
    this.bounceForce = BOUNCE_DAMPENING;
  }

  update() {
    // Apply gravity
    this.dy += this.gravity;

    // Update position
    this.x += this.dx;
    this.y += this.dy;

    // Bounce off walls
    if (this.x < this.radius || this.x > CANVAS_WIDTH - this.radius) {
      this.dx *= -1;
      this.x = constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    }

    // Bounce off floor
    if (this.y > CANVAS_HEIGHT - this.radius) {
      this.dy *= -this.bounceForce;
      this.y = CANVAS_HEIGHT - this.radius;
    }
  }

  display() {
    // Draw the ball
    push();
    // Ball gradient effect
    let colorValue = map(this.health, 0, this.originalHealth, 100, 255);
    fill(colorValue, 150, 50);
    stroke(0);
    strokeWeight(2);
    circle(this.x, this.y, this.radius * 2);

    // Display health number
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(this.radius * 0.8);
    text(this.health, this.x, this.y);
    pop();
  }

  hit(damage) {
    // Reduce health when hit
    this.health -= damage;

    // Add to score
    score += damage;

    // Check if ball should be destroyed
    if (this.health <= 0) {
      // Split into smaller balls if large enough
      if (this.radius >= MIN_SPLIT_RADIUS) {
        return [
          new Ball(
            this.x - this.radius / 2,
            this.y,
            this.radius / 1.5,
            ceil(this.originalHealth / 2)
          ),
          new Ball(
            this.x + this.radius / 2,
            this.y,
            this.radius / 1.5,
            ceil(this.originalHealth / 2)
          ),
        ];
      }
      return []; // Ball is destroyed, return empty array
    }
    return null; // Ball is not destroyed yet
  }
}
```

### Bullet Class (bullet.js)

```javascript
class Bullet {
  constructor(x) {
    this.x = x;
    this.y = CANVAS_HEIGHT - CANNON_HEIGHT - 15;
    this.speed = BULLET_SPEED;
    this.damage = bulletPower;
    this.width = 4;
    this.height = 10;
  }

  update() {
    // Move bullet upward
    this.y -= this.speed;
  }

  display() {
    // Draw bullet
    push();
    fill(255, 255, 0);
    noStroke();
    rectMode(CENTER);
    rect(this.x, this.y, this.width, this.height, 2);
    pop();
  }

  checkCollision(ball) {
    // Check if bullet hits ball using distance formula
    let distance = dist(this.x, this.y, ball.x, ball.y);
    return distance < ball.radius;
  }

  isOffScreen() {
    // Check if bullet is off screen
    return this.y < 0;
  }
}
```

### Game Management (game.js)

````javascript
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
    lastBulletTime = 0;

    // Create initial balls
    createNewBalls();

    // Set game state to playing
    gameState = 'PLAYING';
}

function createNewBalls() {
    // Create initial balls based on level
    let numBalls = 2 + Math.min(level, 6); // Cap at 8 balls maximum

    for (let i = 0; i < numBalls; i++) {
        balls.push(new Ball());
    }
}

function updateGame() {
    // Auto-fire bullets based on fire rate
    if (millis() - lastBulletTime > 1000 / fireRate) {
        bullets.push(new Bullet(cannon.x));
        lastBulletTime = millis();
    }

    // Update and check cannon
    cannon.update();

    // Update and check bullets
    updateBullets();

    // Update and check balls
    updateBalls();

    // Check level completion
    checkLevelCompletion();
}

function updateBullets() {
    // Update bullets in reverse order for safe removal
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();

        // Check collision with balls
        let bulletHit = false;

        for (let j = balls.length - 1; j >= 0; j--) {
            if (bullets[i] && bullets[i].checkCollision(balls[j])) {
                // Ball is hit by bullet
                const newBalls = balls[j].hit(bullets[i].damage);

                // Handle ball destruction and splitting
                if (newBalls !== null) {
                    balls.splice(j, 1);
                    if (newBalls.length > 0) {
                        balls = balls.concat(newBalls);
                    }
                }

                // Remove bullet
                bullets.splice(i, 1);
                bulletHit = true;
                break;
            }
        }

        // Remove bullets that go off screen (if not already removed)
        if (!bulletHit && bullets[i] && bullets[i].isOffScreen()) {
            bullets.splice(i, 1);
        }
    }
}

function updateBalls() {
    // Update balls
    for (let i = balls.length - 1; i >= 0; i--) {
        balls[i].update();

        // Check for collision with cannon
        if (cannon.checkCollision(balls[i])) {
            gameOver = true;
            gameState = 'GAME_OVER';
        }
    }
}

function checkLevelCompletion() {
    // Check if all balls are destroyed
    if (balls.length === 0) {
        level++;
        createNewBalls();
    }
}

function displayGame() {
    // Clear background
    background(240);

    // Draw game elements
    displayUI();
    cannon.display();

    // Display bullets
    bullets.forEach(bullet => {
        bullet.display();
    });

    // Display balls
    balls.forEach(ball => {
        ball.display();
    });
}

function displayUI() {
    // Display score and level
    push();
    fill(0);
    textAlign(LEFT, TOP);
    textSize(20);
    text(`Score: ${score}`, 10, 10);
    text(`Level: ${level}`, 10, 40);
    pop();
}

function displayTitleScreen() {
    background(240);

    push();
    // Title
    textAlign(CENTER, CENTER);
    fill(30, 30, 120);
    textSize(40);
    text("BALL BLAST", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);

    // Instructions
    textSize(20);
    fill(0);
    text("Move the cannon with your mouse", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    text("Destroy all balls before they hit you", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);

    // Start button
    fill(50, 150, 50);
    rectMode(CENTER);
    rect(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100, 120, 50, 10);
    fill(255);
    textSize(24);
    text("START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    pop();
}

function displayGameOverScreen() {
    push();
    // Semi-transparent overlay
    fill(0, 0, 0, 150);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Game over message
    fill(255, 50, 50);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);

    // Score
    fill(255);
    textSize(24);
    text(`Final Score: ${score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    text(`Level Reached: ${level}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);

    // Restart button
    fill(50, 150, 50);
    rectMode(CENTER);
    rect(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100, 150, 50, 10);
    fill(255);
    textSize(24);
    text("PLAY AGAIN", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 100);
    pop();
}

// Check for button clicks
function mouseClicked() {
    // Start button on title screen
    if (gameState === 'TITLE') {
        let buttonX = CANVAS_WIDTH/2;
        let buttonY = CANVAS_HEIGHT/2 + 100;
        let buttonWidth = 120;
        let buttonHeight = 50;

        if (mouseX > buttonX - buttonWidth/2 && mouseX < buttonX + buttonWidth/2 &&
            mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2) {
            startGame();
        }
    }

    // Restart button on game over screen
    else if (gameState === 'GAME_OVER') {
        let buttonX = CANVAS_WIDTH/2;
        let buttonY = CANVAS_HEIGHT/2 + 100;
        let buttonWidth = 150;
        let buttonHeight = 50;

        if (mouseX > buttonX - buttonWidth/2 && mouseX < buttonX + buttonWidth/2 &&
            mouseY > buttonY - buttonHeight/2 && mouseY < buttonY + buttonHeight/2) {
            startGame();
        }
    }
}

// Add visual effects (optional)
function createExplosion(x, y, size) {
    // This is a placeholder for a particle explosion effect
    // In a full implementation, this would create particle objects
    // that disperse from the given point
    push();
    fill(255, 200, 0, 150);
    noStroke();
    for (let i = 0; i < 10; i++) {
        let angle = random(TWO_PI);
        let distance = random(size);
        let particleX = x + cos(angle) * distance;
        let particleY = y + sin(angle) * distance;
        circle(particleX, particleY, random(3, 8));
    }
    pop();
}

// Main game loop (main.js)
function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    textFont('Arial');
    gameState = 'TITLE';
}

function draw() {
    // Game state management
    switch (gameState) {
        case 'TITLE':
            displayTitleScreen();
            break;
        case 'PLAYING':
            updateGame();
            displayGame();
            break;
        case 'GAME_OVER':
            displayGame();
            displayGameOverScreen();
            break;
    }
}

// Mobile and touch support
function touchMoved() {
    // Update cannon position for mobile/touch devices
    if (gameState === 'PLAYING') {
        cannon.x = constrain(touches[0].x, cannon.width / 2, CANVAS_WIDTH - cannon.width / 2);
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

## Extension Ideas

### 1. Power-ups
Power-ups can add variety and strategic depth to gameplay. Here are some ideas:

#### Power-up Types
- **Multi-shot**: Fire multiple bullets at once (e.g., 3 bullets in a spread pattern)
- **Stronger Bullets**: Increase bullet damage for a limited time
- **Rapid Fire**: Increase firing rate temporarily
- **Shield**: Protect the cannon from one collision
- **Freeze**: Slow down all balls on screen

#### Implementation
```javascript
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'multishot', 'strong', 'rapid', 'shield', 'freeze'
        this.width = 30;
        this.height = 30;
        this.speed = 2;
    }

    update() {
        // Move downward
        this.y += this.speed;
    }

    display() {
        // Draw power-up
        push();
        rectMode(CENTER);
        switch(this.type) {
            case 'multishot':
                fill(100, 100, 255);
                break;
            case 'strong':
                fill(255, 100, 100);
                break;
            case 'rapid':
                fill(100, 255, 100);
                break;
            case 'shield':
                fill(100, 255, 255);
                break;
            case 'freeze':
                fill(200, 200, 255);
                break;
        }
        rect(this.x, this.y, this.width, this.height, 5);
        pop();
    }

    checkCollision(cannon) {
        // Check collision with cannon
        return (
            this.x + this.width/2 > cannon.x - cannon.width/2 &&
            this.x - this.width/2 < cannon.x + cannon.width/2 &&
            this.y + this.height/2 > cannon.y - cannon.height/2 &&
            this.y - this.height/2 < cannon.y + cannon.height/2
        );
    }
}
````

#### Power-up Integration

- Add a `powerUps` array to store active power-ups
- Add a `activePowerUps` object to track active effects
- Randomly spawn power-ups when balls are destroyed
- Update the game logic to check for power-up collisions and apply effects

### 2. Coin System & Upgrades

A progression system allows players to improve their cannon between games:

#### Coins

- Drop from destroyed balls
- Persist between games
- Used to purchase permanent upgrades

#### Upgrade Types

- **Cannon Power**: Increase base bullet damage
- **Fire Rate**: Increase base fire rate
- **Double Shot**: Chance to fire two bullets at once
- **Luck**: Increase power-up and coin drop rates

#### Implementation

```javascript
// Persistent upgrade state
let gameState = {
  coins: 0,
  upgrades: {
    power: 1,
    fireRate: 1,
    doubleShot: 0,
    luck: 1,
  },
};

// Apply upgrades when starting game
function applyUpgrades() {
  bulletPower = INITIAL_BULLET_POWER + gameState.upgrades.power - 1;
  fireRate = INITIAL_FIRE_RATE + (gameState.upgrades.fireRate - 1) * 2;
}

// Shop interface
function displayShop() {
  // Display upgrade options and prices
  // Handle purchase logic
}
```

### 3. Different Ball Types

Variety in ball behavior makes the game more challenging:

#### Ball Variations

- **Heavy Ball**: Falls faster, bounces less
- **Fast Ball**: Moves horizontally faster
- **Splitting Ball**: Splits into more smaller balls
- **Armored Ball**: Requires more hits to destroy (visual armor layer)

#### Implementation

Extend the Ball class with specific types:

```javascript
class HeavyBall extends Ball {
  constructor(x, y, radius, health) {
    super(x, y, radius, health);
    this.gravity = GRAVITY * 1.5;
    this.bounceForce = BOUNCE_DAMPENING * 0.7;
  }

  display() {
    // Custom appearance for heavy ball
    super.display();
    // Add visual indicator for heavy ball
  }
}
```

### 4. Visual and Audio Effects

#### Particle Effects

- Bullet impacts
- Ball destruction
- Power-up collection

#### Sound Effects

- Shooting
- Ball hits
- Ball destruction
- Power-up collection
- Game over

#### Implementation

```javascript
// Particle system
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.alpha = 255;
    this.color = color;
    this.size = random(3, 8);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
  }

  display() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    circle(this.x, this.y, this.size);
  }

  isDead() {
    return this.alpha <= 0;
  }
}

// Sound implementation
function preload() {
  sounds = {
    shoot: loadSound("assets/shoot.wav"),
    hit: loadSound("assets/hit.wav"),
    explosion: loadSound("assets/explosion.wav"),
    powerup: loadSound("assets/powerup.wav"),
    gameOver: loadSound("assets/gameover.wav"),
  };
}
```

## Implementation Checklist

### Basic Game Setup

- [ ] Create HTML, CSS, and JavaScript files
- [ ] Set up P5.js environment
- [ ] Implement basic game structure

### Core Game Elements

- [ ] Implement Cannon class
- [ ] Implement Ball class
- [ ] Implement Bullet class
- [ ] Create basic collision detection

### Game Flow

- [ ] Add title screen
- [ ] Implement game loop
- [ ] Add game over state
- [ ] Implement level progression

### Visuals and UI

- [ ] Add score display
- [ ] Show current level
- [ ] Style game elements
- [ ] Add simple animations

### Enhancements (Optional)

- [ ] Add power-up system
- [ ] Implement coin collection
- [ ] Create upgrade shop
- [ ] Add particle effects
- [ ] Implement sound effects
- [ ] Add mobile/touch support
- [ ] Add different ball types

## Performance Optimization

### Memory Management

- Clean up bullets that go off-screen
- Limit maximum number of particles
- Remove destroyed game objects promptly

### Collision Detection Optimization

- Use spatial partitioning for many objects
- Skip unnecessary collision checks
- Optimize collision algorithms

### Mobile Performance

- Reduce particle effects on mobile
- Scale game difficulty based on device capabilities
- Adjust canvas size for different devices

## Conclusion

This implementation guide provides all the necessary components to create a functional Ball Blast clone. The core gameplay mechanics are simple but engaging, and the extension ideas offer paths to enhance the game further.

Remember to test thoroughly as you implement each feature, particularly the collision detection and game state management. Start with the basic game loop before adding more complex features like power-ups and upgrade systems.

For an AI demo, focus on getting the core mechanics working smoothly first, then add visual polish and additional features as time permits. The modular class-based structure makes it easy to extend the game incrementally.
