import * as PIXI from "./pixi.js"
import { Sprite2d } from "pixi-projection"

export function createHandle(x, y, callback = null) {
  function onDragStart(event) {
    const obj = event.currentTarget
    obj.dragData = event.data
    obj.dragging = 1
    obj.dragPointerStart = event.data.getLocalPosition(obj.parent)
    obj.dragObjStart = new PIXI.Point()
    obj.dragObjStart.copyFrom(obj.position)
    obj.dragGlobalStart = new PIXI.Point()
    obj.dragGlobalStart.copyFrom(event.data.global)
  }

  function onDragEnd(event) {
    const obj = event.currentTarget
    obj.dragging = 0
    obj.dragData = null
  }

  function onDragMove(event) {
    const obj = event.currentTarget
    if (!obj.dragging) return

    if (callback != null) {
      callback()
    }

    const data = obj.dragData // it can be different pointer!
    if (obj.dragging === 1) {
      // click or drag?
      if (
        Math.abs(data.global.x - obj.dragGlobalStart.x) +
          Math.abs(data.global.y - obj.dragGlobalStart.y) >=
        3
      ) {
        // DRAG
        obj.dragging = 2
      }
    }
    if (obj.dragging === 2) {
      const dragPointerEnd = data.getLocalPosition(obj.parent)
      // DRAG
      obj.position.set(
        obj.dragObjStart.x + (dragPointerEnd.x - obj.dragPointerStart.x),
        obj.dragObjStart.y + (dragPointerEnd.y - obj.dragPointerStart.y)
      )
    }
  }

  const handle = new PIXI.Sprite(PIXI.Texture.WHITE)

  handle.factor = 1
  handle.anchor.set(0.5)
  handle.position.set(x, y)
  handle.interactive = true
  handle
    .on("pointerdown", onDragStart)
    .on("pointerup", onDragEnd)
    .on("pointerupoutside", onDragEnd)
    .on("pointermove", onDragMove)

  return handle
}

class TexturedPlane {
  constructor(app) {
    const snap = (obj) => {
      obj.position.x = Math.min(Math.max(obj.position.x, 0), app.screen.width)
      obj.position.y = Math.min(Math.max(obj.position.y, 0), app.screen.height)
    }

    const w = videoWidth
    const h = videoHeight

    function retrievePositions(index) {
      const v = localStorage.getItem("handle" + index)
      if (v != null) {
        return JSON.parse(v)
      } else {
        return defaultPositions[index]
      }
    }

    const defaultPositions = [
      { x: (app.screen.width - w) * 0.5, y: (app.screen.height - h) * 0.5 },
      { x: (app.screen.width + w) * 0.5, y: (app.screen.height - h) * 0.5 },
      { x: (app.screen.width + w) * 0.5, y: (app.screen.height + h) * 0.5 },
      { x: (app.screen.width - w) * 0.5, y: (app.screen.height + h) * 0.5 },
    ]

    const handleCallback = () => {
      handlesChanged = true
    }

    const storedPositions = [
      retrievePositions(0),
      retrievePositions(1),
      retrievePositions(2),
      retrievePositions(3),
    ]

    this.squares = storedPositions.map((d) =>
      createHandle(d.x, d.y, handleCallback)
    )

    this.quad = this.squares.map((s) => s.position)

    this.containerSprite = new Sprite2d(
      PIXI.Texture.from("assets/zerro_animato_png00.png")
    )
    this.containerSprite.anchor.set(0.5)
  }

  show(b) {
    this.squares.forEach((s) => {
      s.visible = !b
    })
    this.containerSprite.visible = !b
  }

  update(image) {
    this.containerSprite.texture = PIXI.Texture.from(image)
    this.containerSprite.texture.update()
    this.containerSprite.proj.mapSprite(this.containerSprite, this.quad)

    if (handlesChanged) {
      this.quad.forEach((d, i) => {
        localStorage.setItem("handle" + i, JSON.stringify({ x: d.x, y: d.y }))
      })
    }
    handlesChanged = false
  }

  render() {}
}

export default TexturedPlane
