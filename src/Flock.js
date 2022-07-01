import * as PIXI from "./pixi.js"
import { createVector } from "./sketch.js"

let alienImages = [
  "zerro_animato_png00.png",
  "zerro_animato_png01.png",
  "zerro_animato_png02.png",
  "zerro_animato_png03.png",
  "zerro_animato_png04.png",
  "zerro_animato_png05.png",
  "zerro_animato_png06.png",
  "zerro_animato_png07.png",
  "zerro_animato_png08.png",
  "zerro_animato_png09.png",
]
let textureArray = []

for (let i = 0; i < 4; i++) {
  let texture = PIXI.Texture.from("assets/" + alienImages[i])
  textureArray.push(texture)
}

function getDistance(v1, v2) {
  var dx = v1.x - v2.x
  var dy = v1.y - v2.y
  return Math.sqrt(dx * dx + dy * dy)
}

function limit(v, l) {
  let x = v.x
  let y = v.y
  const mag = v.magnitude()
  if (mag > l) {
    const v1 = v.normalize()
    x = v1.x * l
    y = v1.y * l
  }
  return createVector(x, y)
}

let shuffledIndices = []

const shuffleIndices = () => {
  shuffledIndices = points.map((d, i) => i).sort((a, b) => 0.5 - Math.random())
}

export class Boid {
  constructor(x, y, i) {
    this.index = i
    // this.sprite = PIXI.Sprite.from("fish.png")
    this.sprite = new PIXI.AnimatedSprite(textureArray)
    this.sprite.pivot.x = 64
    this.sprite.pivot.y = 64
    const s = Math.random() * 0.2 + 0.2

    this.s = s

    this.sprite.scale.x = s
    this.sprite.scale.y = s
    this.maxSteeringforce = maxSteeringforce
    this.maxspeed = maximumSpeed // Maximum speed
    this.seeking = false
    this.acceleration = createVector(0, 0)
    this.velocity = createVector(Math.random() * 2 - 1, Math.random() * 2 - 1)
    this.sprite.position = this.position = createVector(x, y)
    this.r = 128 //Size of object Boid
    this.frameCount = 0
    this.targetIndex = this.index
  }

  run = (boids) => {
    this.flock(boids)
    this.update()
    this.borders()

    // if (!(Math.round(elapsed) % 600)) {
    //   if (this.index == 0) {
    //     shuffleIndices()
    //   }
    //   this.veryclose = false
    //   this.acceleration = createVector(Math.random(), Math.random())
    //   this.targetIndex = shuffledIndices[this.index]
    // }

    if (!(Math.round(elapsed) % 10)) {
      this.frameCount++
      this.sprite.gotoAndStop(this.frameCount % alienImages.length)
    }
  }

  applyForce = (force) => {
    this.acceleration = this.acceleration.add(force)
  }

  home = () => {
    // if (!this.index) console.log(this.velocity.magnitude())
    const target = fishPoints[this.targetIndex]
    const distance = getDistance(target, this.position)

    if (distance < 5) {
      this.velocity = this.velocity.multiplyScalar(0.5)
    } else {
      // if (distance > 5) {
      var desired = target.subtract(this.position)
      desired = desired.normalize()
      var steer = desired.subtract(this.velocity)
      steer = limit(steer, this.maxSteeringforce)
      this.applyForce(steer)
      // } else {
      //   this.veryclose = true
      // }
    }
  }

  resetVelocity = () => {
    // this.velocity = this.velocity.multiplyScalar(0)
  }

  flock = (boids) => {
    if (homing) {
      this.home()
    } else {
      this.veryclose = false
      let sep = this.separate(boids)
      let ali = this.align(boids)
      let coh = this.cohesion(boids)

      sep = sep.multiplyScalar(sepScalar)
      ali = ali.multiplyScalar(aliScalar)
      coh = coh.multiplyScalar(cohScalar)

      this.applyForce(ali)
      this.applyForce(coh)
      this.applyForce(sep)

      if (targetX != null) {
        let mows = this.followTarget()
        mows = mows.multiplyScalar(10)
        this.applyForce(mows)
      }
    }
  }

  update = () => {
    var theta = Math.atan2(this.velocity.y, this.velocity.x)
    this.sprite.rotation = theta

    this.velocity = this.velocity.add(this.acceleration)
    this.velocity = limit(this.velocity, this.maxspeed)

    this.position = this.position.add(this.velocity)
    this.acceleration = this.acceleration.multiplyScalar(0)

    // spirte

    // this.sprite.tint = this.seeking && !homing ? 0xff0000 : 0xffffff

    this.sprite.position.x = this.position.x
    this.sprite.position.y = this.position.y
  }

  seek = (target) => {
    var desired = target.subtract(this.position)
    desired = desired.normalize()
    desired = desired.multiplyScalar(this.maxspeed)
    var steer = desired.subtract(this.velocity)
    steer = limit(steer, this.maxSteeringforce)
    return steer
  }

  borders = () => {
    const w = app.screen.width
    const h = app.screen.height

    const b = window.bounds

    if (this.position.x < -this.r) {
      this.position.x = w + this.r
    }
    if (this.position.x > w + this.r) {
      this.position.x = -this.r
    }

    if (this.position.y < b - this.r) {
      this.position.y = h - b + this.r
    }

    if (this.position.y > h - b + this.r) {
      this.position.y = b - this.r
    }
  }

  separate = (boids) => {
    var desiredseparation = 128.0 * this.s
    var steer = createVector(0, 0)
    var count = 0
    // For every boid in the system, check if it's too close
    for (var i = 0; i < boids.length; i++) {
      var d = getDistance(this.position, boids[i].position)
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if (d > 0 && d < desiredseparation) {
        // Calculate vector pointing away from neighbor
        var diff = this.position.subtract(boids[i].position)
        diff = diff.normalize()
        diff = diff.multiplyScalar(1 / d) // Weight by distance
        steer = steer.add(diff)
        count++ // Keep track of how many
      }
    }
    if (count > 0) {
      steer = steer.multiplyScalar(1 / count)
    }
    if (steer.magnitude() > 0) {
      steer = steer.normalize()
      steer = steer.multiplyScalar(this.maxspeed)
      steer = steer.subtract(this.velocity)
      steer = limit(steer, this.maxSteeringforce)
    }
    return steer
  }

  // Alignment
  // For every nearby boid in the system, calculate the average velocity
  align = (boids) => {
    var sum = createVector(0, 0)
    var count = 0
    for (var i = 0; i < boids.length; i++) {
      if (!boids[i].seeking) {
        var d = getDistance(this.position, boids[i].position)
        if (d > 0 && d < neighbordist) {
          sum = sum.add(boids[i].velocity)
          count++
        }
      }
    }
    if (count > 0) {
      sum = sum.multiplyScalar(1 / count)
      sum = sum.normalize()
      sum = sum.multiplyScalar(this.maxspeed)
      var steer = sum.subtract(this.velocity)
      steer = limit(steer, this.maxSteeringforce)
      return steer
    } else {
      return createVector(0, 0)
    }
  }

  // Cohesion
  // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
  cohesion = (boids) => {
    var sum = createVector(0, 0) // Start with empty vector to accumulate all locations
    var count = 0
    for (var i = 0; i < boids.length; i++) {
      if (!boids[i].seeking) {
        var d = getDistance(this.position, boids[i].position)
        if (d > 0 && d < neighbordist) {
          sum = sum.add(boids[i].position) // Add location
          count++
        }
      }
    }
    if (count > 0) {
      sum = sum.multiplyScalar(1 / count)
      return this.seek(sum) // Steer towards the location
    } else {
      return createVector(0, 0)
    }
  }

  followTarget = () => {
    var m = createVector(targetX, targetY)
    var d = getDistance(this.position, m)
    if (d < minMouseDistance) {
      this.seeking = true
      return this.seek(m) // Steer towards the mouse location
    } else {
      this.seeking = false
      return createVector(0, 0)
    }
  }
}

export class Flock {
  constructor() {
    const amount = points.length
    this.boids = []
    for (var i = 0; i < amount; i++) {
      var b = new Boid(fishPoints[i].x, fishPoints[i].y, i)
      this.boids.push(b)
    }
  }

  run = () => {
    for (var i = 0; i < this.boids.length; i++) {
      this.boids[i].run(this.boids) // Passing the entire list of boids to each boid individually
    }
  }
}
