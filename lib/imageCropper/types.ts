export type CropCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type CropEdge = 'top' | 'right' | 'bottom' | 'left'

export type Rect = {
	x: number
	y: number
	width: number
	height: number
}

export type Point = {
	x: number
	y: number
}

/** A crop rectangle in the source image's natural pixel space. */
export type CropArea = Rect
