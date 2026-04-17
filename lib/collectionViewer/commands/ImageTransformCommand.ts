export interface ViewerSpriteSnapshot {
  x: number
  y: number
  width: number
  height: number
  flipX: boolean
  flipY: boolean
}

export class ViewerImageTransformCommand {
  public readonly id = 'viewer_image_transform'

  public constructor(
    public readonly imageId: string,
    private readonly before: ViewerSpriteSnapshot,
    private readonly after: ViewerSpriteSnapshot,
    private readonly apply: (imageId: string, s: ViewerSpriteSnapshot) => void
  ) {}

  public execute(): void {
    this.apply(this.imageId, this.after)
  }

  public undo(): void {
    this.apply(this.imageId, this.before)
  }
}
