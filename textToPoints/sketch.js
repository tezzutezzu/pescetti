let pts
let caslon

function preload() {
  caslon = loadFont("manofa.ttf")
}

function setup() {
  createCanvas(600, 600)

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
  // for(let i =0; i<pts.length;
}

function draw() {
  background(220)

  translate(20, 140)
  fill(0)
  noStroke()
  for (let i = 0; i < pts.length; i++) {
    ellipse(pts[i].x, pts[i].y, 2, 2)
  }
}
