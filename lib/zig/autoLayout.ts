import { createZigImportObject } from './consoleBridge'

export interface ZigLayoutRect {
	x: number
	y: number
	w: number
	h: number
}

interface ZigAutoLayoutExports {
	memory: WebAssembly.Memory
	setLayoutRectCount: (count: number) => number
	getLayoutRectCount: () => number
	getLayoutInputPtr: () => number
	getLayoutOutputPtr: () => number
	autoLayout: () => void
}

const rectScalarStride = 4

let zigAutoLayoutPromise: Promise<ZigAutoLayoutExports> | null = null

async function instantiateZigAutoLayout(): Promise<ZigAutoLayoutExports> {
	try {
		const response = await fetch('/zig/main.wasm')
		if (!response.ok) {
			throw new Error(`Failed to fetch /zig/main.wasm: ${response.status} ${response.statusText}`)
		}

		const source = await response.arrayBuffer()
		const bridge = createZigImportObject('[zig]')
		const { instance } = await WebAssembly.instantiate(source, bridge.imports)
		const exports = instance.exports as Partial<ZigAutoLayoutExports>

		if (
			exports.memory === undefined ||
			exports.setLayoutRectCount === undefined ||
			exports.getLayoutRectCount === undefined ||
			exports.getLayoutInputPtr === undefined ||
			exports.getLayoutOutputPtr === undefined ||
			exports.autoLayout === undefined
		) {
			throw new Error('WASM exports do not match the Zig auto-layout API')
		}

		bridge.setMemory(exports.memory)
		return exports as ZigAutoLayoutExports
	} catch (error) {
		console.error('Failed to instantiate Zig auto-layout:', error)
		throw error
	}
}

async function getZigAutoLayout(): Promise<ZigAutoLayoutExports> {
	if (zigAutoLayoutPromise === null) {
		zigAutoLayoutPromise = instantiateZigAutoLayout()
	}
	return await zigAutoLayoutPromise
}

export async function roundTripLayoutRects(rects: ZigLayoutRect[]): Promise<ZigLayoutRect[]> {
	const zig = await getZigAutoLayout()
	const accepted = zig.setLayoutRectCount(rects.length)
	if (accepted !== 1) {
		throw new Error(`Zig rejected rect count ${rects.length}`)
	}
	if (zig.getLayoutRectCount() !== rects.length) {
		throw new Error('Zig rect count mismatch after setup')
	}

	const valuesLen = rects.length * rectScalarStride
	const input = new Float32Array(zig.memory.buffer, zig.getLayoutInputPtr(), valuesLen)
	for (const [index, rect] of rects.entries()) {
		const offset = index * rectScalarStride
		input[offset + 0] = rect.x
		input[offset + 1] = rect.y
		input[offset + 2] = rect.w
		input[offset + 3] = rect.h
	}

	zig.autoLayout()

	const output = new Float32Array(zig.memory.buffer, zig.getLayoutOutputPtr(), valuesLen)
	const nextRects: ZigLayoutRect[] = []
	for (let index = 0; index < rects.length; index += 1) {
		const offset = index * rectScalarStride
		nextRects.push({
			x: output[offset + 0] ?? 0,
			y: output[offset + 1] ?? 0,
			w: output[offset + 2] ?? 0,
			h: output[offset + 3] ?? 0,
		})
	}
	return nextRects
}
