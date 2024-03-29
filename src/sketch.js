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
const keypointIndices = [0, 5, 6, 7, 8, 9, 10]

window.maximumSpeed = 10
window.maxSteeringforce = 0.01
window.isPescione = false
window.textPoints = []
window.fishPoints = []
window.handlesChanged = false
// flock parameters
window.sepScalar = 3.0
window.aliScalar = 2.0
window.cohScalar = 2.0

window.videoWidth = 640
window.videoHeight = 480

window.homing = false
window.targets = null
window.app = new PIXI.Application({ resizeTo: window })
window.neighbordist = 200
window.minMouseDistance = window.innerWidth / 2
window.elapsed = 0.0
window.skeletonMode = false
window.bounds = parseFloat(localStorage.getItem("bounds")) || 100

const debugGraphics = new PIXI.Graphics()
debugGraphics.alpha = 0.5
const trackingGraphics = new PIXI.Graphics()

let texturedPlane
let flock
let currentPoses = []
let boundHandle

app.stage.interactive = true

function updateDebug() {
  boundHandle.visible = debugMode
  texturedPlane.show(!debugMode)
  debugGraphics.clear()
}

window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "d") {
      debugMode = !debugMode
      updateDebug()
    } else if (e.key === "s") {
      skeletonMode = !skeletonMode
    } else {
      homing = !homing
      if (homing) {
        isPescione = !isPescione
      }
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

  textPoints = mypoints.map((d) => {
    // const s = 3.5
    const s = (app.screen.width * 0.8) / 300
    const offX = (app.screen.width - 300 * s) * 0.5
    const offY = (window.innerHeight - 116 * s) * 0.5
    return createVector(Math.round(d.x) * s + offX, Math.round(d.y) * s + offY)
  })

  fishPoints = myFishPoints.map((d) => {
    const s = (app.screen.width * 0.8) / 300
    const offX = (app.screen.width - 300 * s) * 0.5
    const offY = (window.innerHeight - 116 * s) * 0.5
    return createVector(Math.round(d.x) * s + offX, Math.round(d.y) * s + offY)
  })

  flock = new Flock()

  boundHandle = createHandle(app.screen.width * 0.9, window.bounds, () => {
    window.bounds = boundHandle.position.y
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
      if (!homing) detectPoses(canvas)

      if (currentPoses.length > 0) {
        const m = texturedPlane.containerSprite.proj.matrix
        // const local = getWorldCoordFromMatrix(m, currentPoses[0].keypoints[0])
        // targetX = local.x
        // targetY = local.y
        // trackingGraphics.beginFill(0xde3249)
        // trackingGraphics.drawCircle(targetX, targetY, 20)
        // trackingGraphics.endFill()
        // drawKeyframes(ctx, currentPoses[0].keypoints)

        targets = []

        keypointIndices.forEach((k, i) => {
          if (currentPoses[0].keypoints[k]) {
            const n = getWorldCoordFromMatrix(m, currentPoses[0].keypoints[k])
            targets.push(createVector(n.x, n.y))
          }
        })

        if (skeletonMode && !homing) drawSkeleton(m, currentPoses[0].keypoints)
      } else {
        targets = null
      }

      if (debugMode) {
        texturedPlane.update(canvas)
      }
    }

    flock.run()
  }

  const startRendering = () => {
    document.body.appendChild(app.view)

    texturedPlane = new TexturedPlane(app)

    //add textured plane
    texturedPlane.squares.forEach((s) => {
      app.stage.addChild(s)
    })
    app.stage.addChild(texturedPlane.containerSprite)

    // add pescetti
    flock.boids.forEach((b) => app.stage.addChild(b.sprite))

    app.stage.addChild(debugGraphics)
    app.stage.addChild(trackingGraphics)
    app.stage.addChild(boundHandle)
    updateDebug()

    // ctx.translate(canvas.width, 0)
    // ctx.scale(-1, 1)
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
function drawSkeleton(matrix, _keypoints, poseId = null) {
  // Each poseId is mapped to a color in the color palette.
  // trackingGraphics.lineWidth = 2

  const keypoints = _keypoints.map((d) => {
    const { x, y } = getWorldCoordFromMatrix(matrix, d)
    return {
      ...d,
      x,
      y,
    }
  })

  trackingGraphics.clear()

  trackingGraphics.lineStyle(4, 0xffffff)

  poseDetection.util.getAdjacentPairs("MoveNet").forEach(([i, j]) => {
    const kp1 = keypoints[i]
    const kp2 = keypoints[j] // If score is null, just show the keypoint.

    const score1 = kp1.score != null ? kp1.score : 1
    const score2 = kp2.score != null ? kp2.score : 1
    const scoreThreshold = 0.25

    if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
      trackingGraphics.moveTo(kp1.x, kp1.y)
      trackingGraphics.lineTo(kp2.x, kp2.y)
      trackingGraphics.closePath()
    }
  })
}

getMedia()

export function createVector(x, y) {
  return new PIXI.Point(x, y)
}
