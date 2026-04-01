import { z } from 'zod'

/** Must match across request + sign-in: hash is SHA256(`${email}:${code}:${pepper}`). */
export function normalizeLoginEmail(raw: string): string {
	return raw.trim().toLowerCase()
}

export const emailNonceRequestSchema = z.object({
	email: z.string().email().transform(normalizeLoginEmail),
})

export const emailNonceVerifySchema = z.object({
	email: z.string().email().transform(normalizeLoginEmail),
	code: z
		.string()
		.transform((c: string) => c.replace(/\D/g, ''))
		.pipe(z.string().length(6)),
})
