export interface BoardImageApi {
	id: string
	url: string
	width: number | null
	height: number | null
	layout: BoardImageLayoutApi
}

/** Plain layout fields for API / persistence (no class instance). */
export interface BoardImageLayoutPlain {
	x: number
	y: number
	w: number
	h: number
	flipX: boolean
	flipY: boolean
}

export interface BoardImageLayoutApi extends BoardImageLayoutPlain {
	zIndex: number
}

/** In-memory layout save payload; maps to PATCH body field names only at the HTTP boundary. */
export type BoardImageLayoutSaveRow = {
	imageId: string
	layout: BoardImageLayoutApi
}
