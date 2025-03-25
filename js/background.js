// Background elements
let clouds = [];
let backgroundBuffer;
// Note: backgroundImage is now declared in main.js

// Initialize background elements
function initBackground() {
  // Create clouds
  createClouds();

  // Create buffer for static elements
  createBackgroundBuffer();
}

// Create clouds
function createClouds(count = 5) {
  // Clear existing clouds
  clouds = [];

  // Create new clouds
  for (let i = 0; i < count; i++) {
    clouds.push(new Cloud());
  }
}

// Create a buffer for static background elements to improve performance
function createBackgroundBuffer() {
  backgroundBuffer = createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw background image to buffer
  if (backgroundImage) {
    backgroundBuffer.image(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    // Fallback if image is not loaded
    drawFallbackBackground(backgroundBuffer);
  }
}

// Draw a fallback background if the image doesn't load
function drawFallbackBackground(buffer) {
  // Simple sky gradient
  buffer.push();
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    let inter = map(y, 0, CANVAS_HEIGHT, 0, 1);
    let c = lerpColor(color(135, 206, 235), color(70, 130, 180), inter);
    buffer.stroke(c);
    buffer.line(0, y, CANVAS_WIDTH, y);
  }
  buffer.pop();
}

// Update background when window is resized
function resizeBackground() {
  // Recreate the background buffer with new dimensions
  createBackgroundBuffer();

  // Reinitialize clouds with new dimensions
  createClouds();
}

// Draw background elements
function drawBackground() {
  // Draw static elements from buffer
  drawStaticBackground();

  // Update and draw dynamic elements
  drawDynamicElements();
}

// Draw just the static background (for transitions)
function drawStaticBackground() {
  image(backgroundBuffer, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Update and draw dynamic elements
function drawDynamicElements() {
  // Update and draw clouds
  clouds.forEach((cloud) => {
    cloud.update();
    cloud.display();
  });
}

// Cloud class with more realistic appearance
class Cloud {
  constructor() {
    this.reset();
    this.x = random(0, CANVAS_WIDTH); // Place clouds randomly across screen initially
  }

  reset() {
    this.x = random(CANVAS_WIDTH, CANVAS_WIDTH + 200);
    this.y = random(50, CANVAS_HEIGHT / 4);
    this.width = random(80, 150) * currentScaleFactor;
    this.height = random(40, 60) * currentScaleFactor;
    this.speed = random(0.2, 0.4) * currentScaleFactor;
    this.alpha = random(180, 220);
    this.numPuffs = floor(random(3, 6));
    this.puffs = [];

    // Generate cloud puffs
    for (let i = 0; i < this.numPuffs; i++) {
      this.puffs.push({
        xOffset: random(-this.width / 2, this.width / 2),
        yOffset: random(-this.height / 3, this.height / 3),
        size: random(0.5, 1.0),
      });
    }
  }

  update() {
    this.x -= this.speed;
    if (this.x < -this.width) {
      this.reset();
    }
  }

  display() {
    push();
    fill(255, 255, 255, this.alpha);
    noStroke();

    // Draw main cloud body
    ellipse(this.x, this.y, this.width, this.height);

    // Draw additional puffs for more realistic cloud shape
    for (let puff of this.puffs) {
      ellipse(
        this.x + puff.xOffset,
        this.y + puff.yOffset,
        this.width * puff.size,
        this.height * puff.size
      );
    }

    pop();
  }
}
