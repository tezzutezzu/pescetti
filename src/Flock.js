import * as PIXI from "./pixi.js"
import { createVector } from "./sketch.js"
import { Boid } from "./Boid.js"

let shuffledIndices = []

const shuffleIndices = () => {
  shuffledIndices = points.map((d, i) => i).sort((a, b) => 0.5 - Math.random())
}

export class Flock {
  constructor() {
    const amount = fishPoints.length
    this.boids = []
    for (var i = 0; i < amount; i++) {
      var b = new Boid(fishPoints[i].x, fishPoints[i].y, i)
      if (i == 0) b.sprite.tint = 0xff00000
      this.boids.push(b)
    }
  }

  run = () => {
    for (var i = 0; i < this.boids.length; i++) {
      this.boids[i].run(this.boids) // Passing the entire list of boids to each boid individually
    }
  }
}
