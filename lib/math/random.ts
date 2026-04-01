import crypto from 'crypto'

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * simple base62 encoder from bytes
 */
function bytesToAlphabet(bytes: Uint8Array, length: number): string {
	let result = ''

	for (let i = 0; result.length < length; i++) {
		const byte = bytes[i % bytes.length]
		result += ALPHABET[byte % ALPHABET.length]
	}

	return result
}

/**
 * Node-only sync hash.
 */
function sha256Sync(input: string): Uint8Array {
	return crypto.createHash('sha256').update(input).digest()
}

/**
 * string → 32-bit seed
 */
function xmur3(str: string): () => number {
	let h = 1779033703 ^ str.length
	for (let i = 0; i < str.length; i++) {
		h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
		h = (h << 13) | (h >>> 19)
	}
	return function () {
		h = Math.imul(h ^ (h >>> 16), 2246822507)
		h = Math.imul(h ^ (h >>> 13), 3266489909)
		return (h ^= h >>> 16) >>> 0
	}
}

/**
 * PRNG (fast, good enough)
 */
function mulberry32(a: number): () => number {
	return function () {
		let t = (a += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/**
 * Sync string ID generator (Node only, for seed scripts).
 */
export function createSeededIdGenerator(
	seed: string,
	options?: {
		length?: number
		namespace?: string
	}
) {
	const length = options?.length ?? 12
	const namespace = options?.namespace ?? 'id'

	let counter = 0

	return function generateId(): string {
		const input = `${namespace}:${seed}:${counter++}`
		const bytes = sha256Sync(input)
		return bytesToAlphabet(bytes, length)
	}
}

/**
 * Create a seeded random number generator
 * @param seed
 * @returns
 */
export function createSeededRandom(seed: string): () => number {
	const seedFn = xmur3(seed)
	return mulberry32(seedFn())
}
