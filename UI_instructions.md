# Creating Mountain Background and Grass Terrain

Let's enhance our Ball Blast game with a visually appealing background featuring mountains and grass terrain with some live elements.

## Background Elements to Add

1. **Sky Gradient Background**
2. **Layered Mountains** (parallax effect optional)
3. **Green Grass Terrain**
4. **Live Elements** (clouds, birds, trees)

## Implementation Approach

### 1. Sky Background

Create a gradient sky background that transitions from light blue to darker blue:

```javascript
function drawSky() {
  // Create a gradient sky effect
  for (let y = 0; y < CANVAS_HEIGHT / 2; y++) {
    let inter = map(y, 0, CANVAS_HEIGHT / 2, 0, 1);
    let c = lerpColor(color(135, 206, 235), color(65, 105, 225), inter);
    stroke(c);
    line(0, y, CANVAS_WIDTH, y);
  }
}
```

### 2. Mountains

Add layered mountains with different colors to create depth:

```javascript
function drawMountains() {
  // Far mountains (darker blue/purple)
  fill(70, 70, 120);
  beginShape();
  vertex(0, CANVAS_HEIGHT / 2);

  // Create jagged mountain peaks
  for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
    let mountainHeight = noise(x * 0.01) * 100;
    vertex(x, CANVAS_HEIGHT / 2 - mountainHeight);
  }

  vertex(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
  endShape(CLOSE);

  // Closer mountains (lighter color)
  fill(90, 90, 150);
  beginShape();
  vertex(0, CANVAS_HEIGHT / 2);

  for (let x = 0; x <= CANVAS_WIDTH; x += 30) {
    let mountainHeight = noise(x * 0.02 + 500) * 150;
    vertex(x, CANVAS_HEIGHT / 2 - mountainHeight);
  }

  vertex(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
  endShape(CLOSE);
}
```

### 3. Grass Terrain

Create a grassy terrain that serves as the game platform:

```javascript
function drawGrassTerrain() {
  // Main terrain
  fill(76, 175, 80);
  beginShape();
  vertex(0, CANVAS_HEIGHT / 2);
  vertex(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
  vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
  vertex(0, CANVAS_HEIGHT);
  endShape(CLOSE);

  // Grass detail on top of terrain
  stroke(50, 130, 50);
  strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 5) {
    let grassHeight = random(5, 15);
    line(x, CANVAS_HEIGHT / 2, x, CANVAS_HEIGHT / 2 - grassHeight);
  }
  strokeWeight(1);
}
```

### 4. Live Elements

Add moving clouds and birds to make the background feel alive:

```javascript
// Clouds class
class Cloud {
  constructor() {
    this.x = random(CANVAS_WIDTH, CANVAS_WIDTH + 200);
    this.y = random(50, CANVAS_HEIGHT / 4);
    this.width = random(50, 120);
    this.height = random(30, 50);
    this.speed = random(0.2, 0.5);
  }

  update() {
    this.x -= this.speed;
    if (this.x < -this.width) {
      this.x = CANVAS_WIDTH + random(50, 150);
      this.y = random(50, CANVAS_HEIGHT / 4);
    }
  }

  display() {
    fill(255, 255, 255, 200);
    noStroke();
    ellipse(this.x, this.y, this.width, this.height);
    ellipse(
      this.x + this.width * 0.2,
      this.y - this.height * 0.1,
      this.width * 0.8,
      this.height * 0.9
    );
    ellipse(
      this.x - this.width * 0.2,
      this.y + this.height * 0.1,
      this.width * 0.7,
      this.height * 0.8
    );
  }
}

// Bird class
class Bird {
  constructor() {
    this.x = random(-100, -50);
    this.y = random(50, CANVAS_HEIGHT / 3);
    this.size = random(5, 10);
    this.speed = random(1, 3);
    this.wingOffset = 0;
    this.wingDirection = random([-1, 1]);
  }

  update() {
    this.x += this.speed;
    // Flap wings
    this.wingOffset += 0.2 * this.wingDirection;
    if (Math.abs(this.wingOffset) > 1) {
      this.wingDirection *= -1;
    }

    if (this.x > CANVAS_WIDTH + 50) {
      this.x = random(-100, -50);
      this.y = random(50, CANVAS_HEIGHT / 3);
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    fill(30);
    noStroke();
    // Simple bird shape
    triangle(
      0,
      0,
      -this.size,
      this.wingOffset * this.size,
      -this.size,
      -this.wingOffset * this.size
    );
    triangle(0, 0, this.size * 1.5, 0, this.size * 0.5, this.size * 0.5);
    pop();
  }
}
```

### 5. Trees

Add some trees on the terrain:

```javascript
function drawTrees() {
  // Draw a few trees along the terrain line
  for (let i = 0; i < 5; i++) {
    let x = i * (CANVAS_WIDTH / 4) + random(-20, 20);
    let y = CANVAS_HEIGHT / 2;

    // Tree trunk
    fill(101, 67, 33);
    rect(x - 5, y - 40, 10, 40);

    // Tree foliage
    fill(34, 139, 34);
    triangle(x - 30, y - 30, x + 30, y - 30, x, y - 80);
    triangle(x - 25, y - 50, x + 25, y - 50, x, y - 90);
    triangle(x - 20, y - 70, x + 20, y - 70, x, y - 100);
  }
}
```

## Integration

Create an array to store clouds and birds, then initialize them in setup:

```javascript
let clouds = [];
let birds = [];

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Create clouds
  for (let i = 0; i < 5; i++) {
    clouds.push(new Cloud());
  }

  // Create birds
  for (let i = 0; i < 3; i++) {
    birds.push(new Bird());
  }

  // Rest of your setup code...
}
```

Draw the background elements at the beginning of the draw function:

```javascript
function draw() {
  // Draw background elements first
  drawSky();
  drawMountains();
  drawTrees();

  // Update and draw clouds
  clouds.forEach((cloud) => {
    cloud.update();
    cloud.display();
  });

  // Update and draw birds
  birds.forEach((bird) => {
    bird.update();
    bird.display();
  });

  drawGrassTerrain();

  // Draw game elements on top of background
  // Rest of your game drawing code...
}
```

## Tips for Performance

1. If the background elements affect performance, consider:

   - Rendering the static elements (sky, mountains, terrain) to an offscreen buffer once
   - Only updating the dynamic elements (clouds, birds) each frame
   - Reducing the number of grass blades or trees

2. For a parallax effect, move closer mountains faster than distant ones when the cannon moves.

3. Consider adding a day/night cycle by gradually changing the sky colors over time.
