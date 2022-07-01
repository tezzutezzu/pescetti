import * as poseDetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as PIXI from "./pixi.js"
import TexturedPlane, { createHandle } from "./TexturedPlane.js"
import { Flock } from "./Flock.js"
import { mypoints, myFishPoints } from "./points.js"
// DEBUG
window.dontTrack = false
window.debugMode = true
// globals
window.maximumSpeed = 5
window.maxSteeringforce = 0.01
window.points = []
window.fishPoints = []
window.handlesChanged = false
// flock parameters
window.sepScalar = 2.0
window.aliScalar = 2.0
window.cohScalar = 2.0

window.videoWidth = 640
window.videoHeight = 480

window.homing = false
window.targetX = null
window.targetY = null
window.app = new PIXI.Application({ resizeTo: window })
window.neighbordist = 200
window.minMouseDistance = 200
window.elapsed = 0.0

window.bounds = parseFloat(localStorage.getItem("bounds")) || 100

const debugGraphics = new PIXI.Graphics()
const trackingGraphics = new PIXI.Graphics()

let texturedPlane
let flock
let currentPoses = []
let boundHandle

app.stage.interactive = true
document.body.appendChild(app.view)

window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "d") {
      boundHandle.visible = false
      debugGraphics.clear()
      debugMode = !debugMode
      texturedPlane.show(!debugMode)
    } else {
      homing = !homing
      if (flock) flock.boids.forEach((b) => b.resetVelocity())
    }
  },
  false
)

function detectPoses(image) {
  this.detector.estimatePoses(image).then((p) => {
    currentPoses = p
  })
}

const detectorConfig = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
}

async function getMedia() {
  let video = document.querySelector("#video")

  this.detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  )

  points = mypoints.map((d) => {
    const s = 3.5
    return createVector(Math.round(d.x) * s + 300, Math.round(d.y) * s + 550)
  })

  fishPoints = myFishPoints.map((d) => {
    const s = (app.screen.width * 0.8) / 300
    const offX = (app.screen.width - 300 * s) * 0.5
    const offY = (window.innerHeight - 116 * s) * 0.5
    return createVector(Math.round(d.x) * s + offX, Math.round(d.y) * s + offY)
  })

  flock = new Flock()

  boundHandle = createHandle(app.screen.width * 0.9, window.bounds, () => {
    localStorage.setItem("bounds", boundHandle.position.y)
  })
  boundHandle.tint = 0x0000bb

  const ctx = canvas.getContext("2d")

  const render = (delta) => {
    elapsed += delta

    if (debugMode) {
      debugGraphics.clear()
      const bdy = boundHandle.position.y
      debugGraphics.beginFill(0x0000ee)
      debugGraphics.drawRect(0, 0, app.screen.width, bdy)
      debugGraphics.drawRect(0, app.screen.height - bdy, app.screen.width, bdy)
      debugGraphics.endFill()
    }

    if (!dontTrack) {
      trackingGraphics.clear()
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      detectPoses(canvas)

      if (currentPoses.length > 0) {
        const local = getWorldCoordFromMatrix(
          texturedPlane.containerSprite.proj.matrix,
          currentPoses[0].keypoints[0]
        )

        targetX = local.x
        targetY = local.y

        trackingGraphics.beginFill(0xde3249)
        trackingGraphics.drawCircle(targetX, targetY, 20)
        trackingGraphics.endFill()

        // drawKeyframes(ctx, currentPoses[0].keypoints)
        // drawSkeleton(ctx, currentPoses[0].keypoints)
      } else {
        targetX = null
        targetY = null
      }

      if (debugMode) {
        texturedPlane.update(canvas)
      }
    }

    flock.run()
  }

  const startRendering = () => {
    texturedPlane = new TexturedPlane(app)

    app.stage.addChild(debugGraphics)
    app.stage.addChild(trackingGraphics)
    app.stage.addChild(boundHandle)

    //add textured plane
    texturedPlane.squares.forEach((s) => {
      app.stage.addChild(s)
    })
    app.stage.addChild(texturedPlane.containerSprite)

    // add pescetti
    flock.boids.forEach((b) => app.stage.addChild(b.sprite))

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    app.ticker.add(render)
  }

  try {
    if (dontTrack) {
      startRendering()
    } else {
      let stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })
      video.srcObject = stream
      video.addEventListener("loadeddata", () => {
        startRendering()
      })
    }
  } catch (err) {
    /* handle the error */
  }
}

function drawKeyframes(ctx, pose) {
  ctx.fillStyle = "#ff00ff"
  ctx.beginPath()
  pose.forEach((k) => {
    ctx.rect(k.x, k.y, 10, 10)
  })
  ctx.fill()
}

function getWorldCoordFromMatrix(matrix, { x, y }) {
  const newPos = new PIXI.Point()
  const { a, b, c, d, tx, ty } = matrix
  const _x = x - videoWidth / 2
  const _y = y - videoHeight / 2

  newPos.x = a * _x + c * _y + tx
  newPos.y = b * _x + d * _y + ty

  return newPos
}
function drawSkeleton(ctx, keypoints, poseId = null) {
  // Each poseId is mapped to a color in the color palette.
  const color = "#ffffff"
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  poseDetection.util.getAdjacentPairs("MoveNet").forEach(([i, j]) => {
    const kp1 = keypoints[i]
    const kp2 = keypoints[j] // If score is null, just show the keypoint.

    const score1 = kp1.score != null ? kp1.score : 1
    const score2 = kp2.score != null ? kp2.score : 1
    const scoreThreshold = 0.25

    if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
      ctx.beginPath()
      ctx.moveTo(kp1.x, kp1.y)
      ctx.lineTo(kp2.x, kp2.y)
      ctx.stroke()
    }
  })
}

getMedia()

export function createVector(x, y) {
  return new PIXI.Point(x, y)
}
