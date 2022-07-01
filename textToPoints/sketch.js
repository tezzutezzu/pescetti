let pts
let caslon
let img
let gr

const grw = 300
const grh = 116
const fishPoints = []
function preload() {
  caslon = loadFont("manofa.ttf")
  img = loadImage("fish.png")
}

const s = 0.3

function setup() {
  createCanvas(window.innerWidth, window.innerHeight)

  pts = caslon.textToPoints("ZERRO", 0, 0, 120, {
    sampleFactor: 0.12,
    simplifyThreshold: 0,
  })
  console.log(pts.length)
  console.log(
    JSON.stringify(
      pts.map((d) => {
        return { x: d.x, y: d.y }
      })
    )
  )
  fill(255)
  background(150)
  image(img, 0, 0, grw, grh)

  const int = 5

  console.log("analyzing fish...")
  for (let j = 0; j <= grw; j += int) {
    for (let k = 0; k <= grh; k += int) {
      const p = get(j, k)
      if (p[0] == 0) {
        fishPoints.push({ x: j, y: k })
      }
    }
  }
  while (fishPoints.length > pts.length) {
    fishPoints.splice(round(random(fishPoints.length - 1)), 1)
  }
  console.log(fishPoints.length)
  console.log(
    JSON.stringify(
      fishPoints.map((d) => {
        return { x: d.x, y: d.y }
      })
    )
  )

  // for (let i = 0; i < grw * grh; i += 10) {
  //   if (gr.pixels[i] < 255) {
  //     fishPoints.push({ x: i % grw, y: floor(i / grh) })
  //   }
  // }
  console.log(fishPoints)

  noStroke()
  fill(255, 0, 0)
  for (let i = 0; i < fishPoints.length; i++) {
    const { x, y } = fishPoints[i]
    const n = (noise(x, y) * 2 - 1) * 10
    ellipse(fishPoints[i].x + n, fishPoints[i].y + n, 5, 5)
  }
  // for(let i =0; i<pts.length;
}

function drawa() {
  background(225)

  translate(20, 140)
  fill(0)
  noStroke()
  for (let i = 0; i < pts.length; i++) {
    ellipse(pts[i].x, pts[i].y, 2, 2)
  }

  fill(255)
}
