import { Container, Graphics, Point, Sprite, type Texture } from 'pixi.js'
import { WidgetCorner, type WidgetPart } from '~~/lib/board/interaction/widgets/WidgetPart'

const FRAME_COLOR = 0x3b82f6

/** Frame/handles sit slightly outside the image bounds. */
const OUTSET = 6

/** Visual handle size in screen pixels (zoom-independent). */
const HANDLE_VISUAL_SIZE_PX = 12

/** Handle border thickness in screen pixels (zoom-independent). */
const HANDLE_STROKE_PX = 2

/** Frame thickness in screen pixels (zoom-independent). */
const FRAME_STROKE_PX = 2

/** Corner collider size in screen pixels (zoom-independent). */
const HANDLE_HIT_SIZE_PX = 56

/** Visual + hit-test overlay for the selected image: frame, corner scale handles, invisible body (drag). */
export class TransformWidget extends Container {
	private readonly frame = new Graphics()

	private readonly handleVisuals: Record<WidgetCorner, Graphics> = {
		[WidgetCorner.nw]: new Graphics(),
		[WidgetCorner.ne]: new Graphics(),
		[WidgetCorner.se]: new Graphics(),
		[WidgetCorner.sw]: new Graphics(),
	}

	private readonly body = new Graphics()

	public constructor() {
		super()
		this.eventMode = 'none'
		this.sortableChildren = true
		this.zIndex = 1
		this.addChild(this.body)
		this.addChild(this.frame)
		for (const g of Object.values(this.handleVisuals)) {
			this.addChild(g)
		}
	}

	public show(): void {
		this.visible = true
	}

	public hide(): void {
		this.visible = false
	}

	/**
	 * Texture quad in sprite local space (uses anchor + *texture* size, not sprite.width/height).
	 * Important: the widget is a child of the sprite, so it inherits sprite.scale; if we used
	 * `sprite.width/height` we'd effectively apply scale twice and the frame would shrink.
	 */
	public static getVisualRect(sprite: Sprite): { x: number; y: number; w: number; h: number } {
		const t: Texture = sprite.texture
		const tw: number = t.orig.width > 0 ? t.orig.width : t.width
		const th: number = t.orig.height > 0 ? t.orig.height : t.height
		const w = Math.max(0, tw)
		const h = Math.max(0, th)
		const ax = sprite.anchor.x
		const ay = sprite.anchor.y
		return { x: -w * ax, y: -h * ay, w, h }
	}

	/** Call when parent sprite width/height/position may have changed. */
	public syncFromParentSprite(): void {
		const sp = this.parent
		if (sp === null || !(sp instanceof Sprite)) {
			return
		}
		const sprite = sp
		const r = TransformWidget.getVisualRect(sprite)
		if (r.w < 1 || r.h < 1) {
			return
		}

		const wt = sprite.worldTransform
		const sx = Math.hypot(wt.a, wt.b)
		const sy = Math.hypot(wt.c, wt.d)
		const s = Math.max(1e-6, (sx + sy) / 2)
		const handleHalf = (HANDLE_VISUAL_SIZE_PX / 2) / s
		const frameStroke = FRAME_STROKE_PX / s
		const handleStroke = HANDLE_STROKE_PX / s

		this.position.set(r.x - OUTSET, r.y - OUTSET)

		this.body.clear()
		this.body.rect(OUTSET, OUTSET, r.w, r.h)
		this.body.fill({ color: 0xffffff, alpha: 0.001 })

		this.frame.clear()
		this.frame.rect(0, 0, r.w + OUTSET * 2, r.h + OUTSET * 2)
		this.frame.stroke({ width: frameStroke, color: FRAME_COLOR, alpha: 0.95 })

		this.drawHandleVisual(this.handleVisuals[WidgetCorner.nw], -handleHalf, -handleHalf, handleHalf, handleStroke)
		this.drawHandleVisual(
			this.handleVisuals[WidgetCorner.ne],
			r.w + OUTSET * 2 - handleHalf,
			-handleHalf,
			handleHalf,
			handleStroke
		)
		this.drawHandleVisual(
			this.handleVisuals[WidgetCorner.se],
			r.w + OUTSET * 2 - handleHalf,
			r.h + OUTSET * 2 - handleHalf,
			handleHalf,
			handleStroke
		)
		this.drawHandleVisual(
			this.handleVisuals[WidgetCorner.sw],
			-handleHalf,
			r.h + OUTSET * 2 - handleHalf,
			handleHalf,
			handleStroke
		)
	}

	private drawHandleVisual(g: Graphics, x: number, y: number, half: number, stroke: number): void {
		g.clear()
		g.rect(x, y, half * 2, half * 2)
		g.fill({ color: FRAME_COLOR, alpha: 1 })
		g.stroke({ width: stroke, color: 0xffffff, alpha: 1 })
	}

	/**
	 * Hit-test in scene global space. Corner hits use a larger rect than the visible handle.
	 */
	public hitTestGlobal(global: Point): WidgetPart | null {
		if (!this.visible || this.parent === null) {
			return null
		}
		const sp = this.parent as Sprite
		const r = TransformWidget.getVisualRect(sp)
		const w = r.w
		const h = r.h
		const wt = sp.worldTransform
		const sx = Math.hypot(wt.a, wt.b)
		const sy = Math.hypot(wt.c, wt.d)
		const s = Math.max(1e-6, (sx + sy) / 2)
		const hitHalf = (HANDLE_HIT_SIZE_PX / 2) / s
		const local = this.toLocal(global)
		for (const corner of [WidgetCorner.nw, WidgetCorner.ne, WidgetCorner.se, WidgetCorner.sw] as const) {
			const hx =
				corner === WidgetCorner.nw || corner === WidgetCorner.sw
					? -hitHalf
					: w + OUTSET * 2 - hitHalf
			const hy =
				corner === WidgetCorner.nw || corner === WidgetCorner.ne
					? -hitHalf
					: h + OUTSET * 2 - hitHalf
			if (
				local.x >= hx &&
				local.x <= hx + hitHalf * 2 &&
				local.y >= hy &&
				local.y <= hy + hitHalf * 2
			) {
				return corner
			}
		}
		if (local.x >= OUTSET && local.x <= OUTSET + w && local.y >= OUTSET && local.y <= OUTSET + h) {
			return 'body'
		}
		return null
	}
}
