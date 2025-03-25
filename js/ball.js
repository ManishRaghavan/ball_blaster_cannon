class Ball {
  constructor(x, y, radius, health) {
    // Size initialization first
    this.radius =
      radius !== undefined ? radius : random(MIN_BALL_RADIUS, MAX_BALL_RADIUS);

    // Store the radius ratio for resizing
    this.radiusRatio = this.radius / MIN_BALL_RADIUS;

    // Position (now using the initialized radius)
    this.x =
      x !== undefined ? x : random(this.radius, CANVAS_WIDTH - this.radius);
    this.y = y !== undefined ? y : this.radius * 2;

    // Health based on size - smaller balls have less health
    if (health !== undefined) {
      this.health = health;
    } else {
      // Make health proportional to size
      const sizeRatio = this.radius / MAX_BALL_RADIUS;
      this.health = floor(random(2, 5) * level * sizeRatio);
    }
    this.originalHealth = this.health;

    // Movement - reduce horizontal speed by making the range smaller
    this.dx = random(0.3, 0.8) * (random() > 0.5 ? 1 : -1) * currentScaleFactor;
    this.dy = 0;

    // Physics - improved bounce force for livelier bounces
    this.gravity = GRAVITY * currentScaleFactor * 0.8; // Reduce gravity by 20%
    this.bounceForce = BOUNCE_DAMPENING + 0.05; // Better bounce with lower gravity

    // Crystal appearance properties
    this.vertices = this.generateCrystalVertices();
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.01, 0.01);
    this.crystalColor = this.generateCrystalColor();

    // Damage effects
    this.lastHitTime = 0;
    this.flashOpacity = 0;
    this.cracks = [];
    this.damageParticles = [];

    // Animation properties
    this.pulseAmount = 0;
    this.pulseDirection = 1;
    this.shakeAmount = 0;
  }

  generateCrystalVertices() {
    // Generate random crystal shape with 5-8 vertices
    const vertices = [];
    const numVertices = floor(random(5, 9));

    for (let i = 0; i < numVertices; i++) {
      // Create uneven vertices for crystal appearance
      const angle = map(i, 0, numVertices, 0, TWO_PI);
      const r = this.radius * random(0.8, 1.2);
      const x = cos(angle) * r;
      const y = sin(angle) * r;
      vertices.push({ x, y });
    }

    return vertices;
  }

  generateCrystalColor() {
    // Generate a base crystal color based on health
    const colorOptions = [
      { r: 70, g: 130, b: 230 }, // Blue
      { r: 160, g: 70, b: 230 }, // Purple
      { r: 230, g: 70, b: 100 }, // Red
      { r: 70, g: 200, b: 170 }, // Teal
      { r: 200, g: 180, b: 70 }, // Gold
    ];

    // Select random color from options
    const baseColor = random(colorOptions);

    // Add slight variations
    return {
      r: constrain(baseColor.r + random(-20, 20), 0, 255),
      g: constrain(baseColor.g + random(-20, 20), 0, 255),
      b: constrain(baseColor.b + random(-20, 20), 0, 255),
    };
  }

  resize() {
    // Update ball size based on new scale
    this.radius = MIN_BALL_RADIUS * this.radiusRatio;

    // Update physics for new scale
    this.gravity = GRAVITY * currentScaleFactor * 0.8; // Keep the 20% gravity reduction

    // Update position to keep within bounds
    this.x = constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);

    // Scale velocity appropriately - use slower horizontal movement
    this.dx =
      (this.dx / (this.dx > 0 ? Math.abs(this.dx) : -Math.abs(this.dx))) *
      random(0.3, 0.8) *
      currentScaleFactor;

    // Regenerate vertices for the new radius
    this.vertices = this.generateCrystalVertices();
  }

  update() {
    // Apply gravity gradually for smoother movement
    this.dy += this.gravity;

    // Update position with controlled speed
    this.x += this.dx;
    this.y += this.dy;

    // Bounce off walls with minimal dampening
    if (this.x < this.radius || this.x > CANVAS_WIDTH - this.radius) {
      this.dx *= -0.99; // Very slight horizontal speed reduction on wall bounces
      this.x = constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
      this.addCrack(); // Add crack on wall collision
    }

    // Bounce off floor with improved bounce physics, accounting for the 100px bottom margin
    if (this.y > CANVAS_HEIGHT - this.radius - 100) {
      // Calculate bounce velocity ensuring good bounce height
      const minBounceVelocity = 3 * currentScaleFactor;

      // If ball is bouncing very slowly, give it a minimum bounce
      if (Math.abs(this.dy) < minBounceVelocity) {
        this.dy = -minBounceVelocity;
      } else {
        // Normal bounce physics with improved bounce factor
        this.dy = -Math.abs(this.dy * this.bounceForce);
      }

      // Ensure ball stays on or above the floor (with margin)
      this.y = CANVAS_HEIGHT - this.radius - 100;

      // Minimal horizontal speed reduction for sustained movement
      this.dx *= 0.99;

      // Add crack and particles on floor collision if moving fast enough
      if (Math.abs(this.dy) > 5 * currentScaleFactor) {
        this.addCrack();
        this.createImpactParticles(3);
      }
    }

    // Update crystal rotation
    this.rotation += this.rotationSpeed;

    // Update pulsating effect
    this.pulseAmount += 0.03 * this.pulseDirection;
    if (this.pulseAmount > 0.1 || this.pulseAmount < 0) {
      this.pulseDirection *= -1;
    }

    // Decrease flash opacity over time
    if (this.flashOpacity > 0) {
      this.flashOpacity -= 10;
    }

    // Decrease shake amount over time
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.9;
    }

    // Update damage particles
    this.updateDamageParticles();
  }

  addCrack() {
    // Don't add too many cracks
    if (this.cracks.length >= 5) return;

    // Create a random crack from center to edge
    const startAngle = random(TWO_PI);
    const endAngle = startAngle + random(-PI / 4, PI / 4);

    this.cracks.push({
      startAngle: startAngle,
      endAngle: endAngle,
      length: random(0.3, 0.9), // Crack length as percentage of radius
    });
  }

  createImpactParticles(count) {
    for (let i = 0; i < count; i++) {
      const angle = random(TWO_PI);
      const speed = random(1, 3) * currentScaleFactor;

      this.damageParticles.push({
        x: this.x,
        y: this.y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        size: random(2, 5) * currentScaleFactor,
        color: this.crystalColor,
        alpha: 255,
        life: random(20, 40),
      });
    }
  }

  updateDamageParticles() {
    for (let i = this.damageParticles.length - 1; i >= 0; i--) {
      const p = this.damageParticles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Add gravity to particles
      p.vy += 0.1 * currentScaleFactor;

      // Decrease life and alpha
      p.life -= 1;
      p.alpha = map(p.life, 0, 40, 0, 255);

      // Remove dead particles
      if (p.life <= 0) {
        this.damageParticles.splice(i, 1);
      }
    }
  }

  display() {
    push();

    // Apply shake effect if active
    if (this.shakeAmount > 0) {
      translate(
        this.x + random(-this.shakeAmount, this.shakeAmount),
        this.y + random(-this.shakeAmount, this.shakeAmount)
      );
    } else {
      translate(this.x, this.y);
    }

    // Apply rotation and pulsation
    rotate(this.rotation);
    const scale = 1 + this.pulseAmount;

    // Draw crystal shadow
    fill(0, 0, 0, 40);
    noStroke();
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x * scale + 3, v.y * scale + 3);
    }
    endShape(CLOSE);

    // Calculate health percentage for color mapping
    const healthPercent = this.health / this.originalHealth;

    // Draw crystal body with health-based colors and subtle gradient
    if (this.flashOpacity > 0) {
      // Flash white when hit
      fill(255, 255, 255, this.flashOpacity);
    } else {
      // Normal color with health tint
      const r = map(healthPercent, 0, 1, 255, this.crystalColor.r);
      const g = map(healthPercent, 0, 1, 0, this.crystalColor.g);
      const b = map(healthPercent, 0, 1, 0, this.crystalColor.b);
      fill(r, g, b, 220);
    }

    // Draw crystal body
    stroke(30, 30, 30, 150);
    strokeWeight(1.5 * currentScaleFactor);
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x * scale, v.y * scale);
    }
    endShape(CLOSE);

    // Draw inner crystal structure (facets)
    noFill();
    stroke(255, 255, 255, 70);
    strokeWeight(0.5 * currentScaleFactor);

    // Draw a few random internal lines for crystal facets
    for (let i = 0; i < 3; i++) {
      const idx1 = floor(random(this.vertices.length));
      const idx2 = floor(random(this.vertices.length));
      if (idx1 !== idx2) {
        line(
          this.vertices[idx1].x * scale * 0.3,
          this.vertices[idx1].y * scale * 0.3,
          this.vertices[idx2].x * scale * 0.8,
          this.vertices[idx2].y * scale * 0.8
        );
      }
    }

    // Draw cracks
    stroke(255, 255, 255, 150);
    strokeWeight(1 * currentScaleFactor);
    for (let crack of this.cracks) {
      const startX = cos(crack.startAngle) * (this.radius * 0.2 * scale);
      const startY = sin(crack.startAngle) * (this.radius * 0.2 * scale);
      const endX = cos(crack.endAngle) * (this.radius * crack.length * scale);
      const endY = sin(crack.endAngle) * (this.radius * crack.length * scale);

      line(startX, startY, endX, endY);
    }

    // Draw health text with better visibility
    noStroke();
    fill(255, 255, 255);
    textAlign(CENTER, CENTER);
    textSize(this.radius * 0.6);
    text(this.health, 0, 0);

    pop();

    // Draw damage particles outside of the main transform
    this.drawDamageParticles();
  }

  drawDamageParticles() {
    noStroke();
    for (const p of this.damageParticles) {
      fill(p.color.r, p.color.g, p.color.b, p.alpha);
      circle(p.x, p.y, p.size);
    }
  }

  hit(damage) {
    // Flash and shake effects when hit
    this.flashOpacity = 230;
    this.shakeAmount = 4 * currentScaleFactor;

    // Create damage particles
    this.createImpactParticles(damage + 1);

    // Add crack based on damage amount
    if (damage >= 3 || random() < 0.3) {
      this.addCrack();
    }

    // Reduce health when hit
    this.health -= damage;

    // Check if ball should be destroyed
    if (this.health <= 0) {
      // Create destruction particles on death
      this.createDestructionEffect();

      // No more ball splitting, just destroy the ball
      return []; // Ball is destroyed, return empty array
    }
    return null; // Ball is not destroyed yet
  }

  createDestructionEffect() {
    // Create a bunch of particles for destruction effect
    for (let i = 0; i < 20; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 6) * currentScaleFactor;
      const dist = random(0.1, 1) * this.radius;

      particles.push(
        new BlastParticle(
          this.x + cos(angle) * dist,
          this.y + sin(angle) * dist,
          this.radius * 0.6,
          this.crystalColor
        )
      );
    }
  }
}
