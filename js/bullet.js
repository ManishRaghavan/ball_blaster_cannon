class Bullet {
  constructor(cannonX, barrelTipY) {
    this.x = cannonX;

    // Use the barrel tip Y position passed from the cannon
    this.y =
      barrelTipY || CANVAS_HEIGHT - CANNON_HEIGHT - CANNON_HEIGHT * 1.2 - 100;

    this.speed = BULLET_SPEED;
    this.damage = bulletPower;
    this.width = 8 * currentScaleFactor;
    this.height = 16 * currentScaleFactor;

    // Visual properties
    this.trail = [];
    this.maxTrailLength = 5; // Number of trail segments
    this.rotation = random(-0.1, 0.1); // Slight random rotation
    this.trailFadeRate = 40; // How quickly trail fades (higher = faster fade)

    // Store initial position in trail
    this.addToTrail();
  }

  update() {
    // Add current position to trail before updating
    this.addToTrail();

    // Move bullet upward
    this.y -= this.speed;

    // Add slight wobble for more dynamic movement
    this.x += sin(frameCount * 0.2 + this.x * 0.1) * 0.3;

    // Limit trail length
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift(); // Remove oldest trail position
    }
  }

  addToTrail() {
    this.trail.push({
      x: this.x,
      y: this.y,
      alpha: 255,
    });
  }

  display() {
    push();

    // Draw bullet trail
    noStroke();
    for (let i = 0; i < this.trail.length; i++) {
      let trailItem = this.trail[i];
      // Fade trail based on position in array
      let alpha = map(i, 0, this.trail.length - 1, 50, 200);
      // Decrease alpha over time
      trailItem.alpha -= this.trailFadeRate;
      alpha = min(alpha, trailItem.alpha);

      // Main trail (golden yellow glow)
      fill(255, 200, 0, alpha * 0.7);
      circle(trailItem.x, trailItem.y + this.height / 2, this.width * 0.9);

      // Inner trail (brighter core)
      fill(255, 255, 200, alpha * 0.8);
      circle(trailItem.x, trailItem.y + this.height / 2, this.width * 0.5);
    }

    // Draw bullet body with rotation
    push();
    translate(this.x, this.y);
    rotate(this.rotation);

    // Bullet shadow
    fill(200, 100, 0, 100);
    noStroke();
    ellipse(2, 2, this.width * 0.9, this.height * 0.9);

    // Bullet body with gradient
    let gradient = drawingContext.createLinearGradient(
      -this.width / 2,
      0,
      this.width / 2,
      0
    );
    gradient.addColorStop(0, "rgb(255, 220, 0)");
    gradient.addColorStop(0.5, "rgb(255, 255, 0)");
    gradient.addColorStop(1, "rgb(255, 160, 0)");
    drawingContext.fillStyle = gradient;

    // Bullet outline
    stroke(200, 100, 0);
    strokeWeight(1 * currentScaleFactor);
    ellipse(0, 0, this.width, this.height);

    // Bullet highlight
    noStroke();
    fill(255, 255, 255, 150);
    ellipse(
      -this.width * 0.2,
      -this.height * 0.2,
      this.width * 0.3,
      this.height * 0.3
    );

    pop();

    // Draw bullet glow effect
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "rgba(255, 150, 0, 0.5)";
    noStroke();
    fill(255, 200, 0, 50);
    circle(this.x, this.y, this.width * 2);
    drawingContext.shadowBlur = 0;

    pop();
  }

  isOffScreen() {
    return this.y < 0;
  }

  checkCollision(ball) {
    // Simple distance-based collision
    let d = dist(this.x, this.y, ball.x, ball.y);
    return d < ball.radius + this.width / 2;
  }
}
