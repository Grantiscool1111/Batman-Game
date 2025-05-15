(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const keys = {};
  const gravity = 0.6;
  const friction = 0.8;

  let lives = 3;
  const livesDisplay = document.getElementById("livesDisplay");

  class Platform {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    draw() {
      ctx.fillStyle = "#444";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 50;
      this.height = 50;
      this.velX = 0;
      this.velY = 0;
      this.speed = 4;
      this.jumping = false;
      this.onGround = false;
      this.dead = false;
    }
    update() {
      if (this.dead) return;

      if (keys["a"] || keys["ArrowLeft"]) {
        if (this.velX > -this.speed) this.velX -= 1;
      }
      if (keys["d"] || keys["ArrowRight"]) {
        if (this.velX < this.speed) this.velX += 1;
      }
      if ((keys["w"] || keys["ArrowUp"]) && !this.jumping && this.onGround) {
        this.jumping = true;
        this.velY = -12;
        this.onGround = false;
      }

      this.velY += gravity;
      this.velX *= friction;

      this.x += this.velX;
      this.y += this.velY;

      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

      if (this.y + this.height > canvas.height) {
        this.y = canvas.height - this.height;
        this.velY = 0;
        this.jumping = false;
        this.onGround = true;
      } else {
        this.onGround = false;
      }

      for (const platform of platforms) {
        if (
          this.x < platform.x + platform.width &&
          this.x + this.width > platform.x &&
          this.y + this.height > platform.y &&
          this.y + this.height < platform.y + platform.height + 15 &&
          this.velY >= 0
        ) {
          this.y = platform.y - this.height;
          this.velY = 0;
          this.jumping = false;
          this.onGround = true;
        }
      }
    }
    draw() {
      ctx.fillStyle = "#0000FF";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Enemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 50;
      this.height = 50;
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1.2 + 0.3);
      this.vy = 0;
      this.jumping = false;
      this.onGround = false;
      this.alive = true;
    }
    update() {
      if (!this.alive) return;

      this.x += this.vx;

      if (this.x <= 0) {
        this.x = 0;
        this.vx = -this.vx;
      }
      if (this.x + this.width >= canvas.width) {
        this.x = canvas.width - this.width;
        this.vx = -this.vx;
      }

      this.vy += gravity;
      this.vy *= friction;
      this.y += this.vy;

      if (this.y + this.height > canvas.height) {
        this.y = canvas.height - this.height;
        this.vy = 0;
        this.jumping = false;
        this.onGround = true;
      } else {
        this.onGround = false;
      }

      for (const platform of platforms) {
        if (
          this.x < platform.x + platform.width &&
          this.x + this.width > platform.x &&
          this.y + this.height > platform.y &&
          this.y + this.height < platform.y + platform.height + 15 &&
          this.vy >= 0
        ) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.jumping = false;
          this.onGround = true;

          if (Math.random() < 0.005 && this.onGround) {
            this.vy = -10 - Math.random() * 5;
            this.jumping = true;
            this.onGround = false;
          }
        }
      }

      if (Math.random() < 0.01) {
        this.vx = -this.vx;
      }
    }
    draw() {
      if (!this.alive) return;
      ctx.fillStyle = "#008000";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Boomerang {
    constructor(player) {
      this.width = 30;
      this.height = 30;
      this.x = player.x + player.width / 2 - this.width / 2;
      this.y = player.y + player.height / 2 - this.height / 2;
      this.speed = 10;
      this.vx = 0;
      this.vy = 0;
      this.active = false;
      this.returning = false;
      this.player = player;
      this.bounced = false;
    }
    throw(targetX, targetY) {
      if (this.active) return;
      this.x = this.player.x + this.player.width / 2 - this.width / 2;
      this.y = this.player.y + this.player.height / 2 - this.height / 2;
      let dx = targetX - (this.x + this.width / 2);
      let dy = targetY - (this.y + this.height / 2);
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
      this.active = true;
      this.returning = false;
      this.bounced = false;
    }
    update() {
      if (!this.active) {
        this.x = this.player.x + this.player.width / 2 - this.width / 2;
        this.y = this.player.y + this.player.height / 2 - this.height / 2;
        return;
      }
      this.x += this.vx;
      this.y += this.vy;

      if (!this.bounced) {
        if (this.x < 0 || this.x + this.width > canvas.width) {
          this.vx = -this.vx;
          this.bounced = true;
          this.returning = true;
        }
        if (this.y < 0 || this.y + this.height > canvas.height) {
          this.vy = -this.vy;
          this.bounced = true;
          this.returning = true;
        }

        for (const platform of platforms) {
          if (
            this.x < platform.x + platform.width &&
            this.x + this.width > platform.x &&
            this.y + this.height > platform.y &&
            this.y < platform.y + platform.height &&
            !this.bounced
          ) {
            const prevX = this.x - this.vx;
            const prevY = this.y - this.vy;

            if (prevY + this.height <= platform.y) {
              this.vy = -this.vy;
            } else {
              this.vx = -this.vx;
            }
            this.bounced = true;
            this.returning = true;
            break;
          }
        }
      }

      if (this.returning) {
        let dx = this.player.x + this.player.width / 2 - (this.x + this.width / 2);
        let dy = this.player.y + this.player.height / 2 - (this.y + this.height / 2);
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
          this.active = false;
          this.returning = false;
          this.bounced = false;
          this.vx = 0;
          this.vy = 0;
        } else {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed;
        }
      }

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (
          this.x < enemy.x + enemy.width &&
          this.x + this.width > enemy.x &&
          this.y < enemy.y + enemy.height &&
          this.y + this.height > enemy.y
        ) {
          enemy.alive = false;
          this.active = false;
          this.returning = false;
          this.bounced = false;
          break;
        }
      }
    }
    draw() {
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  const player = new Player(100, 0);
  const boomerang = new Boomerang(player);

  const platforms = [
    new Platform(0, 480, 800, 20),
    new Platform(150, 380, 100, 15),
    new Platform(300, 300, 120, 15),
    new Platform(500, 350, 150, 15),
    new Platform(700, 270, 80, 15),
  ];

  const enemies = [
    new Enemy(200, 0),
    new Enemy(350, 0),
    new Enemy(550, 0),
    new Enemy(650, 0),
    new Enemy(750, 0),
  ];

  function resetGame() {
    player.x = 100;
    player.y = 0;
    player.velX = 0;
    player.velY = 0;
    player.dead = false;

    for (const enemy of enemies) {
      enemy.alive = true;
      enemy.x = Math.random() * (canvas.width - enemy.width);
      enemy.y = 0;
      enemy.vx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 1.2 + 0.3);
      enemy.vy = 0;
      enemy.jumping = false;
      enemy.onGround = false;
    }

    lives = 3;
    livesDisplay.textContent = `Lives: ${lives}`;
  }

  function drawLives() {
    livesDisplay.textContent = `Lives: ${lives}`;
  }

  function gameOver() {
    alert("Game Over! Restarting...");
    resetGame();
  }

  function update() {
    if (player.dead) return;

    player.update();
    boomerang.update();

    for (const enemy of enemies) {
      enemy.update();

      if (enemy.alive) {
        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          lives--;
          drawLives();
          if (lives <= 0) {
            player.dead = true;
            gameOver();
          } else {
            player.x = 100;
            player.y = 0;
            player.velX = 0;
            player.velY = 0;
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const platform of platforms) {
      platform.draw();
    }

    player.draw();
    boomerang.draw();

    for (const enemy of enemies) {
      enemy.draw();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  canvas.addEventListener("click", (e) => {
    if (player.dead) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    boomerang.throw(mouseX, mouseY);
  });

  resetGame();
  loop();
})();
