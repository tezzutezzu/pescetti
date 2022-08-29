const grw = 300
const grh = 116
let pts
let caslon
let fishImg
let gr

function preload() {
  caslon = loadFont("manofa.ttf")
  fishImg = loadImage("fish.png")
}

const s = 0.3

function setup() {
  createCanvas(window.innerWidth, window.innerHeight)

  const pd = pixelDensity()

  background(110)

  const fontGr = createGraphics(300, 116)
  fontGr.background(255)
  fontGr.fill(0)
  fontGr.textFont(caslon)
  fontGr.textSize(40)
  fontGr.translate(140, 0)
  fontGr.scale(-1, 1)
  fontGr.text("ZERRO", 10, 45)

  const fontPoints = getPoints(fontGr)
  translate(0, grh)
  const fishPoints = getPoints(fishImg)

  function getPoints(img) {
    const points = []
    const pg = createGraphics(grw, grh)
    pg.background(255, 0, 0)
    pg.image(img, 0, 0, grw / pd, grh / pd)
    pg.loadPixels()

    let c = 0
    const w = grw * pd
    for (let i = 0; i < pg.pixels.length; i += 4) {
      if (pg.pixels[i] == 0) {
        points.push({ x: c % w, y: floor(c / w) })
      }
      c++
    }

    while (points.length > 500) {
      points.splice(round(random(points.length - 1)), 1)
    }

    image(pg, 0, 0)
    fill(255, 0, 0)
    for (let i = 0; i < points.length; i++) {
      const { x, y } = points[i]
      const n = 0 //(noise(x, y) * 2 - 1) * 10
      ellipse(x + n, y + n, 5, 5)
    }
    return points
  }

  console.log(JSON.stringify(fontPoints))
  console.log(JSON.stringify(fishPoints))
}
