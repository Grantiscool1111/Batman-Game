
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const keys = {};
  const gravity = 0.5;
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
    }
    update() {
      if (keys["a"] || keys["ArrowLeft"]) this.velX = -this.speed;
      if (keys["d"] || keys["ArrowRight"]) this.velX = this.speed;
      if ((keys["w"] || keys["ArrowUp"]) && this.onGround) {
        this.jumping = true;
        this.velY = -12;
        this.onGround = false;
      }

      this.velY += gravity;
      this.x += this.velX;
      this.y += this.velY;
      this.velX *= friction;

      this.onGround = false;
      if (this.y + this.height >= canvas.height) {
        this.y = canvas.height - this.height;
        this.velY = 0;
        this.onGround = true;
        this.jumping = false;
      }

      for (const platform of platforms) {
        if (this.x < platform.x + platform.width &&
            this.x + this.width > platform.x &&
            this.y + this.height > platform.y &&
            this.y + this.height < platform.y + platform.height &&
            this.velY >= 0) {
          this.y = platform.y - this.height;
          this.velY = 0;
          this.jumping = false;
          this.onGround = true;
        }
      }
    }
    draw() {
      ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Enemy {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 50;
      this.height = 50;
      this.velX = (Math.random() < 0.5 ? -1 : 1) * 4;
      this.velY = 0;
      this.jumping = false;
      this.onGround = false;
      this.alive = true;
    }
    update() {
      if (!this.alive) return;

      this.velY += gravity;
      this.x += this.velX;
      this.y += this.velY;

      if (this.x <= 0 || this.x + this.width >= canvas.width) {
        this.velX *= -1;
      }

      this.onGround = false;
      if (this.y + this.height >= canvas.height) {
        this.y = canvas.height - this.height;
        this.velY = 0;
        this.jumping = false;
        this.onGround = true;
      }

      for (const platform of platforms) {
        if (this.x < platform.x + platform.width &&
            this.x + this.width > platform.x &&
            this.y + this.height > platform.y &&
            this.y + this.height < platform.y + platform.height &&
            this.velY >= 0) {
          this.y = platform.y - this.height;
          this.velY = 0;
          this.jumping = false;
          this.onGround = true;
        }
      }

      if (this.onGround && Math.random() < 0.01) {
        this.velY = -12;
        this.jumping = true;
      }

      if (
        player.x < this.x + this.width &&
        player.x + player.width > this.x &&
        player.y < this.y + this.height &&
        player.y + player.height > this.y &&
        this.alive
      ) {
        lives--;
        livesDisplay.textContent = "Lives: " + lives;
        if (lives <= 0) alert("Game Over");
        player.x = 50;
        player.y = 400;
      }
    }
    draw() {
      if (!this.alive) return;
      ctx.fillStyle = "green";
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
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
      this.active = true;
      this.returning = false;
      this.bounced = false;
    }
    update() {
      if (!this.active) return;

      this.x += this.vx;
      this.y += this.vy;

      for (const platform of platforms) {
        if (
          this.x < platform.x + platform.width &&
          this.x + this.width > platform.x &&
          this.y < platform.y + platform.height &&
          this.y + this.height > platform.y
        ) {
          this.bounced = true;
          this.returning = true;
        }
      }

      if (this.bounced) {
        let dx = this.player.x + this.player.width / 2 - (this.x + this.width / 2);
        let dy = this.player.y + this.player.height / 2 - (this.y + this.height / 2);
        let dist = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        if (dist < 20) {
          this.active = false;
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
        }
      }
    }
    draw() {
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  const platforms = [
    new Platform(0, 450, 800, 50),
    new Platform(100, 350, 150, 20),
    new Platform(300, 280, 150, 20),
    new Platform(550, 380, 200, 20),
  ];

  const player = new Player(50, 400);
  const enemies = [
    new Enemy(200, 200),
    new Enemy(300, 100),
    new Enemy(500, 300),
    new Enemy(600, 150),
    new Enemy(400, 250),
  ];
  const boomerang = new Boomerang(player);

  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    boomerang.throw(e.clientX - rect.left, e.clientY - rect.top);
  });

  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.update();
    player.draw();
    for (const platform of platforms) platform.draw();
    for (const enemy of enemies) {
      enemy.update();
      enemy.draw();
    }
    boomerang.update();
    boomerang.draw();
    livesDisplay.textContent = "Lives: " + lives;
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
})();
