(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const keys = {};
  let lives = 3;
  const livesDisplay = document.getElementById("livesDisplay");

  const gravity = 0.5;
  const friction = 0.8;

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
      if (keys["a"] || keys["arrowleft"]) {
        if (this.velX > -this.speed) this.velX -= 1;
      }
      if (keys["d"] || keys["arrowright"]) {
        if (this.velX < this.speed) this.velX += 1;
      }
      if ((keys["w"] || keys["arrowup"]) && !this.jumping && this.onGround) {
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
        this.jumping = false;
        this.onGround = true;
        this.velY = 0;
      }

      this.onGround = false;
      for (const platform of platforms) {
        if (
          this.x < platform.x + platform.width &&
          this.x + this.width > platform.x &&
          this.y + this.height > platform.y &&
          this.y + this.height < platform.y + platform.height &&
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
      this.vx = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 1.5);
      this.vy = 0;
      this.jumping = false;
      this.onGround = false;
      this.alive = true;
    }
    update() {
      if (!this.alive) return;

      if (Math.random() < 0.01) this.vx *= -1;

      this.x += this.vx;
      this.vy += gravity;

      if (Math.random() < 0.005 && this.onGround) {
        this.vy = -18 - Math.random() * 10;
        this.jumping = true;
        this.onGround = false;
      }

      this.y += this.vy;

      if (this.x <= 0) {
        this.x = 0;
        this.vx = Math.abs(this.vx);
      }
      if (this.x + this.width >= canvas.width) {
        this.x = canvas.width - this.width;
        this.vx = -Math.abs(this.vx);
      }

      if (this.y + this.height > canvas.height) {
        this.y = canvas.height - this.height;
        this.vy = 0;
        this.jumping = false;
        this.onGround = true;
      }

      this.onGround = false;
      for (const platform of platforms) {
        if (
          this.x < platform.x + platform.width &&
          this.x + this.width > platform.x &&
          this.y + this.height > platform.y &&
          this.y + this.height < platform.y + platform.height &&
          this.vy >= 0
        ) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.jumping = false;
          this.onGround = true;
        }
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
      if (!this.active) {
        this.x = this.player.x + this.player.width / 2 - this.width / 2;
        this.y = this.player.y + this.player.height / 2 - this.height / 2;
        return;
      }
      this.x += this.vx;
      this.y += this.vy;

      if (!this.bounced) {
        for (const platform of platforms) {
          if (
            this.x < platform.x + platform.width &&
            this.x + this.width > platform.x &&
            this.y < platform.y + platform.height &&
            this.y + this.height > platform.y
          ) {
            this.vx = -this.vx;
            this.vy = -this.vy;
            this.bounced = true;
            this.returning = true;
            break;
          }
        }
        if (
          this.x < 0 || this.x + this.width > canvas.width ||
          this.y < 0 || this.y + this.height > canvas.height
        ) {
          this.vx = -this.vx;
          this.vy = -this.vy;
          this.bounced = true;
          this.returning = true;
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
    new Platform(100, 350, 150,
