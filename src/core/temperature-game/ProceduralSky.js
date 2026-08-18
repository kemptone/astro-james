const SKY_PALETTES = {
  day: {
    sunny: ['#087fce', '#38a9eb', '#b8e8fb'],
    bright: ['#217fba', '#66abd0', '#d1e6ed'],
    dim: ['#456f88', '#7898a8', '#c2ced1'],
    overcast: ['#3e5665', '#72848d', '#a9b2b6'],
    storm: ['#132a3b', '#344e5c', '#687781'],
  },
  night: {
    clear: ['#010713', '#071b36', '#21476c'],
    dim: ['#050b17', '#14243a', '#39526b'],
    overcast: ['#070b12', '#1c2938', '#485666'],
    storm: ['#03050a', '#111a28', '#303e4b'],
  },
}

const CLOUD_COLORS = {
  white: { light: [252, 254, 255], mid: [225, 237, 244], dark: [152, 177, 192] },
  gray: { light: [205, 218, 224], mid: [151, 169, 179], dark: [86, 105, 117] },
  storm: { light: [118, 136, 149], mid: [73, 91, 105], dark: [29, 43, 56] },
  night: { light: [113, 133, 158], mid: [65, 82, 106], dark: [23, 35, 56] },
}

function seeded(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

function eased(value) {
  return 1 - Math.pow(1 - value, 3)
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function interpolate(start, end, amount) {
  return start + (end - start) * amount
}

function gridHash(x, y, seed) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed + 1, 1442695041)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = x - x0
  const ty = y - y0
  const smoothX = tx * tx * (3 - 2 * tx)
  const smoothY = ty * ty * (3 - 2 * ty)
  const top = interpolate(gridHash(x0, y0, seed), gridHash(x0 + 1, y0, seed), smoothX)
  const bottom = interpolate(gridHash(x0, y0 + 1, seed), gridHash(x0 + 1, y0 + 1, seed), smoothX)
  return interpolate(top, bottom, smoothY)
}

function fractalNoise(x, y, seed) {
  let total = 0
  let amplitude = 0.56
  let frequency = 1
  let weight = 0

  for (let octave = 0; octave < 4; octave += 1) {
    total += valueNoise(x * frequency, y * frequency, seed + octave * 17) * amplitude
    weight += amplitude
    amplitude *= 0.5
    frequency *= 2.05
  }

  return total / weight
}

export class ProceduralSky {
  constructor(canvas) {
    this.canvas = canvas
    this.context = canvas.getContext('2d', { alpha: false })
    this.weather = null
    this.previousWeather = null
    this.transitionStarted = 0
    this.cloudSprites = new Map()
    this.moonSprite = null
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.animationFrame = null
    this.width = 1
    this.height = 1
    this.pixelRatio = 1

    this.stars = Array.from({ length: 120 }, (_, index) => ({
      x: seeded(index + 4),
      y: seeded(index + 40) * 0.72,
      size: 0.45 + seeded(index + 80) * 1.65,
      phase: seeded(index + 120) * Math.PI * 2,
    }))

    this.clouds = Array.from({ length: 14 }, (_, index) => ({
      x: seeded(index + 200),
      y: 0.02 + seeded(index + 240) * 0.53,
      scale: 0.54 + seeded(index + 280) * 0.92,
      speed: 0.55 + seeded(index + 320) * 0.72,
      variant: index % 4,
      depth: seeded(index + 360),
    }))

    this.drops = Array.from({ length: 250 }, (_, index) => ({
      x: seeded(index + 400),
      y: seeded(index + 700),
      speed: 0.7 + seeded(index + 1000) * 0.7,
      length: 0.65 + seeded(index + 1300) * 0.75,
      alpha: 0.35 + seeded(index + 1600) * 0.55,
    }))

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
    this.animate = this.animate.bind(this)
    this.animationFrame = requestAnimationFrame(this.animate)
  }

  setWeather(weather, immediate = false) {
    if (!weather || weather === this.weather) return
    this.previousWeather = immediate ? null : this.weather
    this.weather = weather
    this.transitionStarted = performance.now()

    if (this.reducedMotion) this.draw(performance.now())
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect()
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, Math.round(bounds.width))
    this.height = Math.max(1, Math.round(bounds.height))
    this.canvas.width = Math.round(this.width * this.pixelRatio)
    this.canvas.height = Math.round(this.height * this.pixelRatio)

    if (this.reducedMotion) this.draw(performance.now())
  }

  animate(timestamp) {
    this.draw(timestamp)
    this.animationFrame = requestAnimationFrame(this.animate)
  }

  draw(timestamp) {
    if (!this.weather) return

    const context = this.context
    const time = this.reducedMotion ? 12 : timestamp / 1000
    const transition = this.previousWeather
      ? Math.min(1, (timestamp - this.transitionStarted) / 900)
      : 1

    context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0)
    context.clearRect(0, 0, this.width, this.height)

    if (this.previousWeather && transition < 1) {
      this.drawWeather(this.previousWeather, time, 1)
      this.drawWeather(this.weather, time, eased(transition))
    } else {
      this.previousWeather = null
      this.drawWeather(this.weather, time, 1)
    }
  }

  drawWeather(weather, time, opacity) {
    const context = this.context
    context.save()
    context.globalAlpha = opacity
    this.drawSkyGradient(weather)
    if (weather.time === 'night' && weather.cloudCover < 0.98) {
      this.drawStars(time, clamp(1 - weather.cloudCover * 1.06))
    }
    this.drawCelestialBody(weather, time)
    this.drawAtmosphericHaze(weather)
    this.drawClouds(weather, time)
    if (weather.rain) this.drawRain(weather, time)
    if (weather.lightning) this.drawLightning(weather, time)
    context.restore()
  }

  drawSkyGradient(weather) {
    const context = this.context
    const palettes = SKY_PALETTES[weather.time]
    const colors = palettes[weather.lighting] || palettes[weather.time === 'day' ? 'bright' : 'clear']
    const gradient = context.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(0.56, colors[1])
    gradient.addColorStop(1, colors[2])
    context.fillStyle = gradient
    context.fillRect(0, 0, this.width, this.height)
  }

  drawAtmosphericHaze(weather) {
    const context = this.context
    const horizon = context.createLinearGradient(0, this.height * 0.42, 0, this.height)
    const isNight = weather.time === 'night'
    horizon.addColorStop(0, 'rgba(255,255,255,0)')
    horizon.addColorStop(0.72, isNight ? 'rgba(90,130,165,0.05)' : 'rgba(238,250,255,0.12)')
    horizon.addColorStop(1, isNight ? 'rgba(6,14,27,0.28)' : 'rgba(255,255,255,0.3)')
    context.fillStyle = horizon
    context.fillRect(0, 0, this.width, this.height)
  }

  drawCelestialBody(weather, time) {
    // Apple Weather's fully overcast scenes have no readable sun or moon at all.
    // Stopping here also keeps the body from glowing through storm decks.
    if (weather.cloudCover >= 0.98) return

    const context = this.context
    const x = this.width * 0.54
    const y = weather.time === 'day' ? this.height * 0.018 : this.height * 0.15
    const radius = Math.max(30, Math.min(this.width, this.height) * (weather.time === 'day' ? 0.052 : 0.068))
    const visibility = clamp(1 - weather.cloudCover * 1.02)

    context.save()
    context.globalAlpha *= visibility

    if (weather.time === 'day') {
      const pulse = 1 + Math.sin(time * 0.24) * 0.012
      context.globalCompositeOperation = 'screen'

      // A huge, nearly colorless atmospheric bloom makes the source feel
      // overexposed instead of like a yellow circle pasted onto the sky.
      const atmosphere = context.createRadialGradient(x, y, radius * 0.2, x, y, radius * 10.5 * pulse)
      atmosphere.addColorStop(0, 'rgba(255,255,255,1)')
      atmosphere.addColorStop(0.055, 'rgba(255,255,255,0.98)')
      atmosphere.addColorStop(0.16, 'rgba(255,252,229,0.62)')
      atmosphere.addColorStop(0.38, 'rgba(255,239,183,0.22)')
      atmosphere.addColorStop(0.7, 'rgba(204,236,255,0.07)')
      atmosphere.addColorStop(1, 'rgba(190,230,255,0)')
      context.fillStyle = atmosphere
      context.fillRect(0, 0, this.width, this.height)

      const glare = context.createRadialGradient(x, y, 0, x, y, radius * 2.25 * pulse)
      glare.addColorStop(0, 'rgba(255,255,255,1)')
      glare.addColorStop(0.38, 'rgba(255,255,255,1)')
      glare.addColorStop(0.62, 'rgba(255,255,252,0.96)')
      glare.addColorStop(0.82, 'rgba(255,249,218,0.45)')
      glare.addColorStop(1, 'rgba(255,244,205,0)')
      context.fillStyle = glare
      context.fillRect(x - radius * 2.3, y - radius * 2.3, radius * 4.6, radius * 4.6)

      // A soft vertical sensor bloom is visible around an intensely bright sun.
      const bloom = context.createLinearGradient(x, y - radius * 7, x, y + radius * 7)
      bloom.addColorStop(0, 'rgba(255,255,255,0)')
      bloom.addColorStop(0.43, 'rgba(255,255,255,0.025)')
      bloom.addColorStop(0.5, 'rgba(255,255,255,0.16)')
      bloom.addColorStop(0.57, 'rgba(255,255,255,0.025)')
      bloom.addColorStop(1, 'rgba(255,255,255,0)')
      context.fillStyle = bloom
      context.fillRect(x - radius * 0.12, y - radius * 7, radius * 0.24, radius * 14)

      this.drawLensFlare(x, y, radius)
    } else {
      context.globalCompositeOperation = 'screen'
      const halo = context.createRadialGradient(x, y, radius * 0.68, x, y, radius * 3.4)
      halo.addColorStop(0, 'rgba(242,248,255,0.36)')
      halo.addColorStop(0.3, 'rgba(184,216,244,0.13)')
      halo.addColorStop(1, 'rgba(164,204,239,0)')
      context.fillStyle = halo
      context.fillRect(0, 0, this.width, this.height)

      context.globalCompositeOperation = 'source-over'
      context.drawImage(this.getMoonSprite(), x - radius, y - radius, radius * 2, radius * 2)
    }

    context.restore()
  }

  getMoonSprite() {
    if (this.moonSprite) return this.moonSprite

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    const image = context.createImageData(canvas.width, canvas.height)
    const data = image.data
    const craters = [
      [-0.42, -0.38, 0.1], [-0.2, -0.52, 0.055], [0.08, -0.56, 0.07], [0.38, -0.43, 0.095],
      [-0.55, -0.12, 0.07], [-0.29, -0.08, 0.13], [0.08, -0.18, 0.06], [0.4, -0.08, 0.115],
      [-0.48, 0.2, 0.11], [-0.15, 0.18, 0.065], [0.14, 0.12, 0.1], [0.54, 0.2, 0.055],
      [-0.28, 0.44, 0.085], [0.02, 0.5, 0.12], [0.34, 0.42, 0.075], [0.17, 0.7, 0.045],
    ]
    const maria = [
      [-0.22, -0.17, 0.31, 0.23, 0.24],
      [0.25, -0.22, 0.24, 0.3, 0.19],
      [0.14, 0.22, 0.3, 0.22, 0.15],
      [-0.37, 0.28, 0.2, 0.27, 0.11],
    ]

    for (let pixelY = 0; pixelY < canvas.height; pixelY += 1) {
      for (let pixelX = 0; pixelX < canvas.width; pixelX += 1) {
        const normalizedX = (pixelX + 0.5) / canvas.width * 2 - 1
        const normalizedY = (pixelY + 0.5) / canvas.height * 2 - 1
        const distanceSquared = normalizedX * normalizedX + normalizedY * normalizedY
        if (distanceSquared >= 1) continue

        const sphereZ = Math.sqrt(1 - distanceSquared)
        const surface = fractalNoise(normalizedX * 3.1 + 7.4, normalizedY * 3.1 - 2.8, 137)
        const fineSurface = fractalNoise(normalizedX * 12.5 - 4.2, normalizedY * 12.5 + 8.7, 229)
        let albedo = 0.9 + (surface - 0.5) * 0.18 + (fineSurface - 0.5) * 0.07

        for (const [mariaX, mariaY, width, height, darkness] of maria) {
          const deltaX = (normalizedX - mariaX) / width
          const deltaY = (normalizedY - mariaY) / height
          albedo -= Math.exp(-(deltaX * deltaX + deltaY * deltaY) * 1.8) * darkness
        }

        for (const [craterX, craterY, craterRadius] of craters) {
          const deltaX = normalizedX - craterX
          const deltaY = normalizedY - craterY
          const craterDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / craterRadius
          if (craterDistance >= 1.22) continue

          const rim = Math.exp(-Math.pow((craterDistance - 0.91) / 0.1, 2))
          const bowl = craterDistance < 0.88 ? Math.pow(1 - craterDistance / 0.88, 1.5) : 0
          const directionalShade = clamp((deltaX - deltaY) / craterRadius * 0.5, -0.5, 0.5)
          albedo += rim * (0.022 + directionalShade * 0.025) - bowl * (0.038 - directionalShade * 0.024)
        }

        // Near-front lighting keeps a full-moon appearance while the normal and
        // limb falloff retain the volume of a sphere.
        const light = clamp(normalizedX * -0.14 + normalizedY * -0.19 + sphereZ * 0.972)
        const limb = 0.68 + sphereZ * 0.32
        const brightness = clamp(albedo * (0.68 + light * 0.32) * limb, 0.36, 1)
        const offset = (pixelY * canvas.width + pixelX) * 4
        data[offset] = Math.round(216 * brightness + 27)
        data[offset + 1] = Math.round(220 * brightness + 29)
        data[offset + 2] = Math.round(218 * brightness + 31)
        data[offset + 3] = Math.round(clamp((1 - Math.sqrt(distanceSquared)) / 0.012) * 255)
      }
    }

    context.putImageData(image, 0, 0)
    this.moonSprite = canvas
    return canvas
  }

  drawLensFlare(sunX, sunY, radius) {
    const context = this.context
    const centerX = this.width / 2
    const centerY = this.height / 2
    const vectorX = centerX - sunX
    const vectorY = centerY - sunY

    ;[
      [0.55, radius * 0.18, 'rgba(115,205,255,0.2)'],
      [0.92, radius * 0.32, 'rgba(255,224,120,0.12)'],
      [1.4, radius * 0.13, 'rgba(141,218,255,0.16)'],
    ].forEach(([distance, size, color]) => {
      context.fillStyle = color
      context.beginPath()
      context.arc(sunX + vectorX * distance, sunY + vectorY * distance, size, 0, Math.PI * 2)
      context.fill()
    })
  }

  drawStars(time, visibility = 1) {
    const context = this.context
    context.save()
    context.globalAlpha *= visibility
    context.globalCompositeOperation = 'screen'

    this.stars.forEach(star => {
      const shimmer = 0.42 + (Math.sin(time * 1.25 + star.phase) + 1) * 0.24
      const x = star.x * this.width
      const y = star.y * this.height
      context.fillStyle = `rgba(232,244,255,${shimmer})`
      context.beginPath()
      context.arc(x, y, star.size, 0, Math.PI * 2)
      context.fill()
    })

    context.restore()
  }

  getCloudSprite(weather, variant) {
    const paletteName = weather.time === 'night'
      ? 'night'
      : weather.lighting === 'storm'
        ? 'storm'
        : weather.lighting === 'dim' || weather.lighting === 'overcast'
          ? 'gray'
          : 'white'
    const key = `${paletteName}-${variant}`

    if (this.cloudSprites.has(key)) return this.cloudSprites.get(key)

    const canvas = document.createElement('canvas')
    canvas.width = 420
    canvas.height = 210
    const context = canvas.getContext('2d')
    const palette = CLOUD_COLORS[paletteName]
    const image = context.createImageData(canvas.width, canvas.height)
    const data = image.data
    const lobes = [
      { x: 0, y: 0.28, radiusX: 0.96, radiusY: 0.27 },
      ...Array.from({ length: 8 }, (_, index) => ({
        x: -0.72 + (index / 7) * 1.44 + (seeded(index + variant * 29) - 0.5) * 0.16,
        y: 0.08 - seeded(index + variant * 37) * 0.42,
        radiusX: 0.2 + seeded(index + variant * 43) * 0.23,
        radiusY: 0.27 + seeded(index + variant * 53) * 0.25,
      })),
    ]

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const normalizedX = (x / canvas.width - 0.5) * 2
        const normalizedY = (y / canvas.height - 0.5) * 2
        let cloudShape = 0
        for (const lobe of lobes) {
          const distanceX = (normalizedX - lobe.x) / lobe.radiusX
          const distanceY = (normalizedY - lobe.y) / lobe.radiusY
          cloudShape = Math.max(cloudShape, Math.exp(-(distanceX * distanceX + distanceY * distanceY) * 1.45))
        }
        const noise = fractalNoise(normalizedX * 2.15 + variant * 7.3, normalizedY * 2.7, variant * 41 + 9)
        const fineNoise = valueNoise(normalizedX * 9.5 + variant, normalizedY * 10.5, variant * 73 + 3)
        const density = cloudShape * 0.78 + (noise - 0.48) * 0.52 + (fineNoise - 0.5) * 0.08 - 0.16
        let alpha = clamp(density / 0.34)
        alpha = alpha * alpha * (3 - 2 * alpha)
        const edgeX = clamp((1 - Math.abs(normalizedX)) / 0.18)
        const edgeY = clamp((1 - Math.abs(normalizedY)) / 0.26)
        const edgeFade = edgeX * edgeY
        alpha *= edgeFade * edgeFade * (3 - 2 * edgeFade)

        if (alpha <= 0.005) continue

        const verticalLight = clamp(0.18 + (1 - y / canvas.height) * 0.72 + (noise - 0.5) * 0.26)
        const lowerColor = verticalLight < 0.48 ? palette.dark : palette.mid
        const upperColor = verticalLight < 0.48 ? palette.mid : palette.light
        const colorAmount = verticalLight < 0.48 ? verticalLight / 0.48 : (verticalLight - 0.48) / 0.52
        const offset = (y * canvas.width + x) * 4

        data[offset] = Math.round(interpolate(lowerColor[0], upperColor[0], colorAmount))
        data[offset + 1] = Math.round(interpolate(lowerColor[1], upperColor[1], colorAmount))
        data[offset + 2] = Math.round(interpolate(lowerColor[2], upperColor[2], colorAmount))
        data[offset + 3] = Math.round(alpha * 238)
      }
    }

    context.putImageData(image, 0, 0)

    this.cloudSprites.set(key, canvas)
    return canvas
  }

  drawClouds(weather, time) {
    if (!weather.cloudCover) return

    const context = this.context
    const count = Math.max(1, Math.round(weather.cloudCover * this.clouds.length))

    context.save()
    for (let index = 0; index < count; index += 1) {
      const cloud = this.clouds[index]
      const width = (185 + this.width * 0.12) * cloud.scale
      const height = width * 0.5
      const travel = this.width + width * 1.7
      const offset = (time * 6.5 * cloud.speed + cloud.x * travel) % travel
      const x = offset - width * 0.85
      const y = cloud.y * this.height - height * 0.24
      const sprite = this.getCloudSprite(weather, cloud.variant)
      const cloudOpacity = 0.52 + weather.cloudCover * 0.32 + cloud.depth * 0.08

      context.globalAlpha = cloudOpacity
      context.drawImage(sprite, x, y, width, height)
    }
    context.restore()
  }

  drawRain(weather, time) {
    const context = this.context
    const count = Math.max(12, Math.round(weather.rain * this.drops.length))
    const baseSpeed = weather.drizzle ? 220 : 640 + weather.rain * 460
    const baseLength = weather.drizzle ? 8 : 17 + weather.rain * 27

    context.save()
    context.lineCap = 'round'

    for (let index = 0; index < count; index += 1) {
      const drop = this.drops[index]
      const length = baseLength * drop.length
      const y = (drop.y * this.height + time * baseSpeed * drop.speed) % (this.height + length * 2) - length
      const x = (drop.x * this.width + time * 28 * drop.speed) % (this.width + 80) - 40

      if (weather.isolated && x > this.width * 0.36 && x < this.width * 0.64) continue

      const gradient = context.createLinearGradient(x, y, x - length * 0.16, y + length)
      gradient.addColorStop(0, 'rgba(225,242,255,0)')
      gradient.addColorStop(1, `rgba(225,242,255,${weather.drizzle ? 0.36 : drop.alpha})`)
      context.strokeStyle = gradient
      context.lineWidth = weather.drizzle ? 0.75 : 1 + weather.rain * 0.65
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x - length * 0.16, y + length)
      context.stroke()
    }

    if (weather.rain > 0.72) {
      const mist = context.createLinearGradient(0, this.height * 0.35, 0, this.height)
      mist.addColorStop(0, 'rgba(205,225,239,0)')
      mist.addColorStop(1, `rgba(171,199,216,${weather.time === 'night' ? 0.1 : 0.18})`)
      context.fillStyle = mist
      context.fillRect(0, 0, this.width, this.height)
    }

    context.restore()
  }

  drawLightning(weather, time) {
    const context = this.context
    const period = weather.isolated ? 9.5 : 6.4
    const phase = (time + weather.code * 0.43) % period
    if (phase > 0.24) return

    const intensity = phase < 0.08 ? phase / 0.08 : Math.max(0, 1 - (phase - 0.08) / 0.16)
    context.save()
    context.globalCompositeOperation = 'screen'
    context.fillStyle = `rgba(218,235,255,${intensity * 0.52})`
    context.fillRect(0, 0, this.width, this.height)

    if (phase < 0.14) {
      const startX = this.width * (weather.isolated ? 0.22 : 0.58)
      let x = startX
      let y = this.height * 0.08
      context.strokeStyle = `rgba(245,249,255,${0.58 + intensity * 0.42})`
      context.lineWidth = 1.4 + intensity * 2
      context.shadowColor = '#b7d7ff'
      context.shadowBlur = 18
      context.beginPath()
      context.moveTo(x, y)

      for (let step = 0; step < 9; step += 1) {
        x += (seeded(step + weather.code * 19) - 0.5) * this.width * 0.09
        y += this.height * (0.055 + seeded(step + weather.code * 23) * 0.035)
        context.lineTo(x, y)
      }
      context.stroke()
    }

    context.restore()
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame)
    this.resizeObserver.disconnect()
    this.cloudSprites.clear()
    this.moonSprite = null
  }
}
