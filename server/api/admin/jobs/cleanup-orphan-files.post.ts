import { container } from '~~/lib/di/container'
import { ServiceAlias } from '~~/lib/di/ServiceAlias'
import type { OrphanFilesCleanupJob } from '~~/server/jobs/OrphanFilesCleanupJob'
import { requireAdmin } from '~~/server/utils/requireAdmin'
import { requireJobSecret } from '~~/server/utils/requireJobSecret'

/** Streams NDJSON: `{type:'progress',message}` lines, then one `{type:'complete',success,message}`. */
export default defineEventHandler(async (event) => {
	await requireAdmin(event)
	requireJobSecret(event)

	const job = container.resolve<OrphanFilesCleanupJob>(ServiceAlias.OrphanFilesCleanupJob)
	const encoder = new TextEncoder()

	setHeader(event, 'Content-Type', 'application/x-ndjson')
	setHeader(event, 'Cache-Control', 'no-cache')

	return new ReadableStream({
		async start(controller) {
			const send = (line: object): void => {
				controller.enqueue(encoder.encode(JSON.stringify(line) + '\n'))
			}
			try {
				const message = await job.run((m) => send({ type: 'progress', message: m }))
				send({ type: 'complete', success: true, message })
			} catch (error) {
				console.error('[cleanup-orphan-files]', error)
				send({ type: 'complete', success: false, message: error instanceof Error ? error.message : String(error) })
			} finally {
				controller.close()
			}
		},
	})
})
