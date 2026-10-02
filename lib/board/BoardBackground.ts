import { Container, Texture, TilingSprite } from 'pixi.js'

/** Infinite dot grid behind the world; follows world pan/zoom. */
export class BoardBackground {
	/** Dot spacing in world units. */
	private static readonly SPACING = 24

	private static readonly DOT_RADIUS = 1.25

	private static readonly DOT_COLOR = 'rgba(128, 128, 128, 0.45)'

	/** Texture supersampling so dots stay crisp at max zoom. */
	private static readonly TEXTURE_SCALE = 4

	private readonly sprite: TilingSprite

	public constructor(private readonly worldContainer: Container) {
		this.sprite = new TilingSprite({ texture: BoardBackground.createDotTexture() })
		this.sprite.eventMode = 'none'
	}

	private static createDotTexture(): Texture {
		const size = BoardBackground.SPACING * BoardBackground.TEXTURE_SCALE
		const canvas = document.createElement('canvas')
		canvas.width = size
		canvas.height = size
		const ctx = canvas.getContext('2d')
		if (ctx === null) {
			throw new Error('BoardBackground: 2d context unavailable')
		}
		ctx.fillStyle = BoardBackground.DOT_COLOR
		ctx.beginPath()
		ctx.arc(size / 2, size / 2, BoardBackground.DOT_RADIUS * BoardBackground.TEXTURE_SCALE, 0, Math.PI * 2)
		ctx.fill()
		return Texture.from(canvas)
	}

	public get view(): TilingSprite {
		return this.sprite
	}

	public resize(width: number, height: number): void {
		this.sprite.width = width
		this.sprite.height = height
	}

	/** Mirrors world transform onto tile offset/scale. */
	public sync(): void {
		const zoom = this.worldContainer.scale.x
		this.sprite.tileScale.set(zoom / BoardBackground.TEXTURE_SCALE)
		this.sprite.tilePosition.set(this.worldContainer.position.x, this.worldContainer.position.y)
	}

	public destroy(): void {
		this.sprite.destroy({ texture: true, textureSource: true })
	}
}
