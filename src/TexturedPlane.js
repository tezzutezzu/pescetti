import * as PIXI from "./pixi.js"
import { Sprite2d } from "pixi-projection"

class TexturedPlane {
  constructor(app) {
    function createSquare(x, y) {
      const square = new PIXI.Sprite(PIXI.Texture.WHITE)
      square.tint = 0xff0000
      square.factor = 1
      square.anchor.set(0.5)
      square.position.set(x, y)
      return square
    }

    const snap = (obj) => {
      obj.position.x = Math.min(Math.max(obj.position.x, 0), app.screen.width)
      obj.position.y = Math.min(Math.max(obj.position.y, 0), app.screen.height)
    }

    function addInteraction(obj) {
      obj.interactive = true
      obj
        .on("pointerdown", onDragStart)
        .on("pointerup", onDragEnd)
        .on("pointerupoutside", onDragEnd)
        .on("pointermove", onDragMove)
    }

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
      snap(obj)
      obj.dragging = 0
      obj.dragData = null
    }

    function onDragMove(event) {
      const obj = event.currentTarget
      if (!obj.dragging) return
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

    const w = videoWidth
    const h = videoHeight
    this.squares = [
      createSquare(w - w / 2, h - h / 2),
      createSquare(w + w / 2, h - h / 2),
      createSquare(w + w / 2, h + h / 2),
      createSquare(w - w / 2, h + h / 2),
    ]

    this.quad = this.squares.map((s) => s.position)

    this.containerSprite = new Sprite2d(
      PIXI.Texture.from("assets/zerro_animato_png00.png")
    )
    this.containerSprite.anchor.set(0.5)

    this.squares.forEach((s) => {
      addInteraction(s)
      app.stage.addChild(s)
    })
    app.stage.addChild(this.containerSprite)
  }

  hide(b) {
    this.squares.forEach((s) => {
      s.alpha = b
    })
    this.containerSprite.alpha = b
  }

  update(image) {
    this.containerSprite.texture = PIXI.Texture.from(image)
    this.containerSprite.texture.update()
    this.containerSprite.proj.mapSprite(this.containerSprite, this.quad)
  }

  render() {}
}

export default TexturedPlane
