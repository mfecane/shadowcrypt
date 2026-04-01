import { eq } from 'drizzle-orm'
import type { EmailNonceService } from '~~/lib/auth/emailNonce'
import { emailNonceRequestSchema } from '~~/lib/auth/emailNonceContract'
import { sendNonceCodeEmail } from '~~/lib/auth/sendNonceCodeEmail'
import { container } from '~~/lib/di/container'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import { emailLoginNonces } from '~~/server/db/schema'
import { useDb } from '~~/server/utils/db'

const GENERIC_SUCCESS_RESPONSE = {
	success: true,
	message: 'If your email can receive messages, we sent a sign-in code.',
} as const

export default defineEventHandler(async (event) => {
	const input: unknown = await readBody(event)
	const parsed = emailNonceRequestSchema.parse(input)
	const nonceService = container.resolve<EmailNonceService>(ServiceAlias.EmailNonceService)
	const db = useDb()
	const now: Date = new Date()
	const nonceCode: string = nonceService.createNonceCode()
	const nonceHash: string = nonceService.hashNonce(parsed.email, nonceCode)
	const nonceId: string = nonceService.createNonceId()
	const expiresAt: Date = nonceService.createExpiresAt(now)

	const green = '\x1b[32m'
	const reset = '\x1b[0m'
	console.log(`Generating nonce for email ${parsed.email} with code ${green}${nonceCode}${reset}`)

	await db.transaction(async (tx) => {
		await tx.delete(emailLoginNonces).where(eq(emailLoginNonces.email, parsed.email))
		await tx.insert(emailLoginNonces).values({
			id: nonceId,
			email: parsed.email,
			nonceHash,
			expiresAt,
			consumedAt: null,
			createdAt: now,
		})
	})

	await sendNonceCodeEmail(parsed.email, nonceCode, nonceService.getTtlMinutes())

	return GENERIC_SUCCESS_RESPONSE
})
