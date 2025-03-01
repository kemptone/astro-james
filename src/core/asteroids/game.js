const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

// Player ship
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 20,
  angle: 0,
  rotation: 0,
  thrust: {x: 0, y: 0},
  speed: 0.05,
  friction: 0.97,
}

// Asteroids
let asteroids = []
const ASTEROID_NUM = 5
const ASTEROID_SIZE = 50

// Bullets
let bullets = []
const BULLET_SPEED = 10

// Game state
let keys = {}

// Event listeners
document.addEventListener('keydown', e => (keys[e.key] = true))
document.addEventListener('keyup', e => (keys[e.key] = false))

// Create initial asteroids
function createAsteroids() {
  asteroids = []
  for (let i = 0; i < ASTEROID_NUM; i++) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: ASTEROID_SIZE,
      vel: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      },
      angle: Math.random() * Math.PI * 2,
    })
  }
}

// Update game objects
function update() {
  // Ship rotation
  if (keys['ArrowLeft']) ship.rotation -= 0.05
  if (keys['ArrowRight']) ship.rotation += 0.05
  ship.angle += ship.rotation

  // Ship thrust
  if (keys['ArrowUp']) {
    ship.thrust.x = Math.cos(ship.angle) * ship.speed
    ship.thrust.y = Math.sin(ship.angle) * ship.speed
  }

  // Move ship
  ship.x += ship.thrust.x
  ship.y += ship.thrust.y
  ship.thrust.x *= ship.friction
  ship.thrust.y *= ship.friction

  // Wrap ship around screen
  if (ship.x < 0) ship.x = canvas.width
  if (ship.x > canvas.width) ship.x = 0
  if (ship.y < 0) ship.y = canvas.height
  if (ship.y > canvas.height) ship.y = 0

  // Shooting
  if (keys[' ']) {
    if (!keys.lastShot || Date.now() - keys.lastShot > 200) {
      bullets.push({
        x: ship.x + Math.cos(ship.angle) * ship.r,
        y: ship.y + Math.sin(ship.angle) * ship.r,
        velX: Math.cos(ship.angle) * BULLET_SPEED,
        velY: Math.sin(ship.angle) * BULLET_SPEED,
        life: 60,
      })
      keys.lastShot = Date.now()
    }
  }

  // Update bullets
  bullets = bullets.filter(b => b.life > 0)
  bullets.forEach(b => {
    b.x += b.velX
    b.y += b.velY
    b.life--
  })

  // Update asteroids
  asteroids.forEach(a => {
    a.x += a.vel.x
    a.y += a.vel.y
    a.angle += 0.02

    // Wrap asteroids
    if (a.x < 0) a.x = canvas.width
    if (a.x > canvas.width) a.x = 0
    if (a.y < 0) a.y = canvas.height
    if (a.y > canvas.height) a.y = 0
  })
}

// Draw everything
function draw() {
  // Clear canvas
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw ship
  ctx.save()
  ctx.translate(ship.x, ship.y)
  ctx.rotate(ship.angle)
  ctx.beginPath()
  ctx.moveTo(ship.r, 0)
  ctx.lineTo(-ship.r, ship.r / 2)
  ctx.lineTo(-ship.r, -ship.r / 2)
  ctx.closePath()
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.restore()

  // Draw asteroids
  asteroids.forEach(a => {
    ctx.save()
    ctx.translate(a.x, a.y)
    ctx.rotate(a.angle)
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const r = a.r * (0.8 + Math.random() * 0.4)
      ctx[i === 0 ? 'moveTo' : 'lineTo'](
        Math.cos(angle) * r,
        Math.sin(angle) * r
      )
    }
    ctx.closePath()
    ctx.strokeStyle = 'white'
    ctx.stroke()
    ctx.restore()
  })

  // Draw bullets
  bullets.forEach(b => {
    ctx.beginPath()
    ctx.arc(b.x, b.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
  })
}

// Game loop
function gameLoop() {
  update()
  draw()
  requestAnimationFrame(gameLoop)
}

// Start game
createAsteroids()
gameLoop()
