let playerImage;
let enemyRightImage;
let enemyLeftImage;
let decoyImage;
let explosionImage;
let layer1;
let layer1OffSet = 0;
let layer2;
let layer2OffSet = 0;
let layer3;
let layer3OffSet = 0;
let scrollSpeed = 2;
let healthTotal = 100;
let health = healthTotal;
let fps = 60;
let lastRestartTime = 0
let time;
let framesUntilSpawnEnemies = 400;
let framesUntilEliteEnemies = 1200;
let damageRate = 0.5;
let gameOver = false;
let playerSpeed = 2.7;
let enemySpeedFloor = 1
const healthSpan = document.querySelector("#health");
const scarecrowSpan = document.querySelector("#scarecrow");

function preload() {
  layer1 = loadImage("bg-1.png");
  layer2 = loadImage("bg-2.png");
  layer3 = loadImage("bg-3.png");
  playerImage = loadImage("player.png");
  enemyRightImage = loadImage("enemy-right.png");
  enemyLeftImage = loadImage("enemy-left.png");
  decoyImage = loadImage("decoy.png");
  explosionImage = loadImage("explosion5.png");
}

function setup() {
  game.initialize();
}

function draw() {
  game.update();
}

function mouseMoved() {
  game.mouseMoved();
}

function mousePressed() {
  game.mousePressed()
}

class Field {
  constructor(width, height, color) {
    Object.assign(this, {
      width,
      height,
      color
    });
  }
  clear() {
    imageMode(CORNER);
    image(layer1, layer1OffSet, 0, width, height);
    image(layer1, layer1OffSet + width, 0, width, height);
    image(layer2, layer2OffSet, 0, width, height);
    image(layer2, layer2OffSet + width, 0, width, height);
    image(layer3, layer3OffSet + width, 0, width, height);
    layer1OffSet -= scrollSpeed
    layer2OffSet -= scrollSpeed * 1.5
    layer3OffSet -= scrollSpeed * 5
    if (layer1OffSet <= -width) {
      layer1OffSet = 0;
    }
    if (layer2OffSet <= -width) {
      layer2OffSet = 0;
    }
    if (layer3OffSet <= -2.5 * width) {
      layer3OffSet = 0;
    }
  }
  clamp(x, y) {
    return {
      x: constrain(x, 0, this.width),
      y: constrain(y, 0, this.height)
    };
  }
}

class Agent {
  constructor(x, y, speed, target, diameter) {
    Object.assign(this, {
      x,
      y,
      speed,
      target,
      diameter,
    });
  }
  move(field) {
    const [dx, dy] = [this.target.x - this.x, this.target.y - this.y];
    const distance = Math.hypot(dx, dy);
    if (distance > 1) {
      const step = this.speed / distance;
      Object.assign(this, field.clamp(this.x + step * dx, this.y + step * dy));
    }
  }
  collidesWith(other) {
    return collideCircleCircle(
      this.x,
      this.y,
      this.diameter,
      other.x,
      other.y,
      other.diameter
    );
  }
}

class Player extends Agent {
  constructor(x, y, speed, target) {
    super(x, y, speed, target, 50)
  }
  draw() {
    imageMode(CENTER);
    image(playerImage, this.x, this.y, 80, 50);
  }
}

class Enemy extends Agent {
  constructor(x, y, speed, target) {
    super(x, y, speed, target, 50)
  }
  draw() {
    imageMode(CENTER);
    if ((this.target.x - this.x) > 0) {
      image(enemyLeftImage, this.x, this.y, 80, 30)
    }
    if ((this.target.x - this.x) <= 0) {
      image(enemyRightImage, this.x, this.y, 80, 30)
    }
  }
}

class Scarecrow {
  constructor() {
    this.x = 0
    this.y = 0
    this.radius = 10
    this.available = true
    this.visible = false
    this.deploymentTime = undefined
    this.expiredTime = undefined
  }
  draw() {
    if (this.visible) {
      imageMode(CENTER);
      image(decoyImage, this.x, this.y, 80, 50);
    }
  }
  place() {
    this.visible = true
    this.x = mouseX
    this.y = mouseY
    for (let enemy of game.enemies) {
      enemy.target = this
    }
    this.deploymentTime = time
  }
  remove() {
    this.visible = false
    this.available = false
    this.deploymentTime = undefined
    this.expiredTime = time
    for (let enemy of game.enemies) {
      enemy.target = game.player
    }
  }
}

const game = {
  initialize() {
    createCanvas(800, 466);
    frameRate(fps)
    this.field = new Field(width, height, "lightgreen");
    this.mouse = {
      x: 0,
      y: 0
    };
    this.player = new Player(20, 20, playerSpeed, this.mouse);
    this.enemies = [
      new Enemy(random(width), random(height), Math.random() + enemySpeedFloor, this.player),
      new Enemy(random(width), random(height), Math.random() + enemySpeedFloor, this.player),
      new Enemy(random(width), random(height), Math.random() + enemySpeedFloor, this.player)
    ];
    this.scarecrow = new Scarecrow();
    this.startLocations = [(-20), (width + 20)]
  },
  checkForCollisions() {
    for (let enemy of this.enemies) {
      if (enemy.collidesWith(this.player)) {
        imageMode(CENTER);
        image(explosionImage, game.player.x, game.player.y, 80, 40)
        health -= damageRate;
        if (health <= 0) {
          health = 0
        }
      }
    }
  },
  checkScarecrow() {
    if (time - game.scarecrow.deploymentTime >= 300) {
      game.scarecrow.remove()
    }
    if (time - game.scarecrow.expiredTime >= 300) {
      game.scarecrow.available = true
      game.scarecrow.expiredTime = undefined
    }
    game.scarecrow.draw()
  },
  gameOver() {
    if (health <= 0) {
      gameOver = true
      time = 0
      game.player.target = (0, 0)
      scrollSpeed += -0.01
      if (scrollSpeed <= 0) {
        scrollSpeed = 0
      }
      textSize(50);
      textFont("VT323");
      fill(249, 243, 173);
      textAlign(CENTER, CENTER);
      text('Game Over!', width / 2, height * 0.5);
      text('click mouse to restart', width / 2, height * 0.66)
    }
  },
  mouseMoved() {
    Object.assign(this.mouse, {
      x: mouseX,
      y: mouseY
    });
  },
  mousePressed() {
    if (!game.scarecrow.visible && game.scarecrow.available) {
      game.scarecrow.place()
    }
    if (gameOver) {
      gameOver = false
      lastRestartTime = frameCount
      health = healthTotal
      scrollSpeed = 2
      game.initialize();
    }
  },
  moveAgents() {
    for (let agent of [this.player, ...this.enemies]) {
      agent.move(this.field);
      agent.draw();
    }
  },
  spawnEnemies() {
    if (time % framesUntilSpawnEnemies === 0 && !gameOver && !game.scarecrow.visible) {
      game.enemies.push(new Enemy(random(game.startLocations), random(height), Math.random() + enemySpeedFloor, game.player));
    }
    if (time % framesUntilSpawnEnemies === 0 && !gameOver && game.scarecrow.visible) {
      game.enemies.push(new Enemy(random(game.startLocations), random(height), Math.random() + enemySpeedFloor, game.scarecrow));
    }
  },
  spawnEliteEnemies() {
    if (time % framesUntilEliteEnemies === 0 && !gameOver && !game.scarecrow.visible) {
      game.enemies.push(new Enemy(random(game.startLocations), random(height), Math.random() + ((0.9 * playerSpeed) - 1), game.player));
    }
    if (time % framesUntilEliteEnemies === 0 && !gameOver && game.scarecrow.visible) {
      game.enemies.push(new Enemy(random(game.startLocations), random(height), Math.random() + ((0.9 * playerSpeed) - 1), game.scarecrow));
    }
  },
  updateHUD() {
    healthSpan.textContent = health.toFixed(0);
    if (!game.scarecrow.visible && game.scarecrow.available) {
      scarecrowSpan.textContent = "click MOUSE to use DECOY";
    }
    if (game.scarecrow.visible) {
      scarecrowSpan.textContent = "DECOY DEPLOYED";
    }
    if (!game.scarecrow.available) {
      scarecrowSpan.textContent = `NEW DECOY in ${5 - ((time - game.scarecrow.expiredTime)/60).toFixed(0)}`;
    }
  },
  update() {
    this.field.clear();
    time = frameCount - lastRestartTime
    this.checkScarecrow();
    this.checkForCollisions();
    this.moveAgents();
    this.spawnEnemies();
    this.spawnEliteEnemies();
    this.updateHUD();
    this.gameOver();
  },
}