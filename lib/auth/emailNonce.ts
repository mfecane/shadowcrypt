import { createHash, randomBytes } from 'node:crypto'

export class EmailNonceService {
	private readonly ttlMinutes = 15

	public constructor(private readonly pepper: string) {
		if (pepper === '') {
			throw new Error('EmailNonceService: pepper is empty')
		}
	}

	public createNonceCode(): string {
		return String(Math.floor(100000 + Math.random() * 900000))
	}

	public hashNonce(email: string, code: string): string {
		return createHash('sha256').update(`${email}:${code}:${this.pepper}`).digest('hex')
	}

	public createNonceId(): string {
		return randomBytes(16).toString('hex')
	}

	public createExpiresAt(now: Date): Date {
		return new Date(now.getTime() + this.ttlMinutes * 60 * 1000)
	}

	public getTtlMinutes(): number {
		return this.ttlMinutes
	}
}
