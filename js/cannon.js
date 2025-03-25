class Cannon {
  constructor() {
    this.width = CANNON_WIDTH;
    this.height = CANNON_HEIGHT;
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT - this.height / 2 - 100; // Bottom of screen minus the 100px margin
    this.lastBulletTime = 0;

    // Animation properties
    this.recoilAmount = 0;
    this.wheelRotation = 0;
    this.barrelHeat = 0;
    this.lastMoveX = this.x;
    this.smokeParticles = [];

    // Cannon design properties
    this.wheelDiameter = this.height * 0.8;
    this.barrelWidth = this.width * 0.4;
    this.barrelLength = this.height * 1.2;
  }

  resize() {
    // Update dimensions
    this.width = CANNON_WIDTH;
    this.height = CANNON_HEIGHT;

    // Update position
    this.y = CANVAS_HEIGHT - this.height / 2 - 100;

    // Update design properties
    this.wheelDiameter = this.height * 0.8;
    this.barrelWidth = this.width * 0.4;
    this.barrelLength = this.height * 1.2;
  }

  update() {
    // Calculate movement for wheel rotation
    const moveAmount = this.x - this.lastMoveX;
    this.wheelRotation += moveAmount * 0.1;
    this.lastMoveX = this.x;

    // Update position based on mouse
    this.x = constrain(mouseX, this.width / 2, CANVAS_WIDTH - this.width / 2);

    // Auto-fire bullets based on fire rate
    const currentTime = millis();
    if (currentTime - this.lastBulletTime > 1000 / fireRate) {
      // Calculate barrel tip position
      const barrelTipY =
        this.y - this.height / 2 - this.barrelLength + this.recoilAmount;

      // Create bullet at cannon's barrel tip
      bullets.push(new Bullet(this.x, barrelTipY));
      this.lastBulletTime = currentTime;

      // Add recoil effect when firing
      this.recoilAmount = 5 * currentScaleFactor;
      this.barrelHeat = min(this.barrelHeat + 10, 100);

      // Add smoke particles
      this.addSmokeParticle();
    }

    // Decrease recoil over time
    this.recoilAmount *= 0.8;

    // Cool down barrel over time
    this.barrelHeat *= 0.95;

    // Update smoke particles
    this.updateSmokeParticles();
  }

  display() {
    push();

    // Draw base platform
    fill(70);
    rectMode(CENTER);
    rect(
      this.x,
      this.y + this.height * 0.2,
      this.width * 0.9,
      this.height * 0.4,
      5 * currentScaleFactor
    );

    // Draw wheels (with rotation animation)
    fill(40);
    stroke(20);
    strokeWeight(2 * currentScaleFactor);

    // Left wheel
    push();
    translate(this.x - this.width * 0.3, this.y + this.height * 0.25);
    rotate(this.wheelRotation);
    circle(0, 0, this.wheelDiameter);
    // Wheel spokes
    stroke(60);
    line(-this.wheelDiameter / 2, 0, this.wheelDiameter / 2, 0);
    line(0, -this.wheelDiameter / 2, 0, this.wheelDiameter / 2);
    line(
      -this.wheelDiameter / 3,
      -this.wheelDiameter / 3,
      this.wheelDiameter / 3,
      this.wheelDiameter / 3
    );
    line(
      -this.wheelDiameter / 3,
      this.wheelDiameter / 3,
      this.wheelDiameter / 3,
      -this.wheelDiameter / 3
    );
    // Wheel hub
    fill(100);
    circle(0, 0, this.wheelDiameter * 0.3);
    pop();

    // Right wheel
    push();
    translate(this.x + this.width * 0.3, this.y + this.height * 0.25);
    rotate(this.wheelRotation);
    circle(0, 0, this.wheelDiameter);
    // Wheel spokes
    stroke(60);
    line(-this.wheelDiameter / 2, 0, this.wheelDiameter / 2, 0);
    line(0, -this.wheelDiameter / 2, 0, this.wheelDiameter / 2);
    line(
      -this.wheelDiameter / 3,
      -this.wheelDiameter / 3,
      this.wheelDiameter / 3,
      this.wheelDiameter / 3
    );
    line(
      -this.wheelDiameter / 3,
      this.wheelDiameter / 3,
      this.wheelDiameter / 3,
      -this.wheelDiameter / 3
    );
    // Wheel hub
    fill(100);
    circle(0, 0, this.wheelDiameter * 0.3);
    pop();

    // Draw cannon base (with recoil animation)
    fill(50);
    stroke(30);
    strokeWeight(1.5 * currentScaleFactor);
    rect(
      this.x,
      this.y - this.height * 0.1,
      this.width * 0.7,
      this.height * 0.5,
      8 * currentScaleFactor
    );

    // Draw cannon barrel with heat effect
    let barrelY =
      this.y - this.height / 2 - this.barrelLength / 2 + this.recoilAmount;

    // Barrel shadow
    fill(30);
    noStroke();
    rect(
      this.x + 2 * currentScaleFactor,
      barrelY + 2 * currentScaleFactor,
      this.barrelWidth,
      this.barrelLength,
      this.barrelWidth / 2
    );

    // Barrel with heat coloring
    let barrelColor = lerpColor(
      color(70),
      color(255, 100, 0),
      this.barrelHeat / 100
    );
    fill(barrelColor);
    stroke(30);
    strokeWeight(1.5 * currentScaleFactor);
    rect(
      this.x,
      barrelY,
      this.barrelWidth,
      this.barrelLength,
      this.barrelWidth / 2
    );

    // Barrel highlight
    noStroke();
    fill(255, 255, 255, 50);
    rect(
      this.x - this.barrelWidth * 0.25,
      barrelY,
      this.barrelWidth * 0.2,
      this.barrelLength,
      this.barrelWidth / 4
    );

    // Draw smoke particles
    this.drawSmokeParticles();

    pop();
  }

  // Add a new smoke particle
  addSmokeParticle() {
    // Use the same barrel tip position as bullets
    let barrelTipY =
      this.y - this.height / 2 - this.barrelLength + this.recoilAmount;

    for (let i = 0; i < 3; i++) {
      this.smokeParticles.push({
        x: this.x + random(-5, 5) * currentScaleFactor,
        y: barrelTipY,
        size: random(5, 10) * currentScaleFactor,
        vx: random(-0.5, 0.5) * currentScaleFactor,
        vy: random(-2, -1) * currentScaleFactor,
        alpha: 200,
        life: 255,
      });
    }
  }

  // Update smoke particles
  updateSmokeParticles() {
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      let p = this.smokeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.size += 0.2 * currentScaleFactor;
      p.alpha -= 5;
      p.life -= 5;

      // Remove particles that have faded
      if (p.life <= 0) {
        this.smokeParticles.splice(i, 1);
      }
    }
  }

  // Draw smoke particles
  drawSmokeParticles() {
    noStroke();
    for (let p of this.smokeParticles) {
      fill(200, 200, 200, p.alpha);
      circle(p.x, p.y, p.size);
    }
  }

  checkCollision(ball) {
    // Check if ball hits cannon using distance formula
    let dx = abs(ball.x - this.x);
    let dy = abs(ball.y - this.y);

    // Check if too far away
    if (dx > this.width / 2 + ball.radius) return false;
    if (dy > this.height / 2 + ball.radius) return false;

    // Check if close enough on one axis
    if (dx <= this.width / 2) return true;
    if (dy <= this.height / 2) return true;

    // Check corner case
    let cornerDistance =
      (dx - this.width / 2) ** 2 + (dy - this.height / 2) ** 2;
    return cornerDistance <= ball.radius ** 2;
  }
}
