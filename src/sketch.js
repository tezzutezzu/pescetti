import * as poseDetection from "@tensorflow-models/pose-detection"
import "@tensorflow/tfjs-backend-webgl"
import * as PIXI from "./pixi.js"
import TexturedPlane from "./TexturedPlane.js"
import { Boid, Flock } from "./Flock.js"

// globals
window.width = window.innerWidth
window.height = window.innerHeight

window.videoWidth = 640
window.videoHeight = 480

window.homing = false
window.targetX = 0
window.targetY = 0
window.app = new PIXI.Application({ width, height })
window.neighbordist = 200
window.minMouseDistance = 200
window.elapsed = 0.0

const graphics = new PIXI.Graphics()
const texturedPlane = new TexturedPlane(app)

app.stage.interactive = true

app.stage.addChild(graphics)
document.body.appendChild(app.view)

window.addEventListener(
  "keydown",
  () => {
    homing = !homing
    // if (homing) {
    //   graphics.beginFill(0xde3249)
    //   points.forEach((p) => {
    //     graphics.drawCircle(p.x, p.y, 2)
    //   })
    //   graphics.endFill()
    // } else {
    //   graphics.clear()
    // }
  },
  false
)
const flock = new Flock()

let currentPoses = []

function detectPoses(image) {
  this.detector.estimatePoses(image).then((p) => {
    currentPoses = p
  })
}

const detectorConfig = {
  modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
}

let mode = 0
window.document.addEventListener("keydown", () => {
  mode++
  mode %= 3
  texturedPlane.hide(mode == 2 ? 0 : 1)
})

async function getMedia() {
  let video = document.querySelector("#video")

  this.detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  )

  try {
    let stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    video.srcObject = stream
    const ctx = canvas.getContext("2d")
    video.addEventListener("loadeddata", () => {
      app.ticker.add((delta) => {
        elapsed += delta
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (mode == 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }

        // draw
        if (currentPoses.length > 0) {
          const local = getWorldCoordFromMatrix(
            texturedPlane.containerSprite.proj.matrix,
            currentPoses[0].keypoints[0]
          )

          graphics.clear()
          graphics.beginFill(0xde3249)
          graphics.drawCircle(targetX, targetY, 20)
          graphics.endFill()
          targetX = local.x
          targetY = local.y
          // drawKeyframes(ctx, currentPoses[0].keypoints)
          // drawSkeleton(ctx, currentPoses[0].keypoints)
        } else {
          targetX = null
          targetY = null
        }
        texturedPlane.update(canvas)
        detectPoses(video)

        flock.run()
      })
    })
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
