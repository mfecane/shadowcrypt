import { JobLogLine, JobRunState } from '~/types/adminJobs'
import type { AdminJob } from '~/types/adminJobs'

const SECRET_STORAGE_KEY = 'admin-jobs-secret'

interface JobStreamLine {
	type: 'progress' | 'complete'
	message: string
	success?: boolean
}

export function useAdminJobRunner(jobs: AdminJob[]) {
	const secret = ref('')
	const secretError = ref<string | null>(null)
	const runs = reactive(new Map<string, JobRunState>(jobs.map((job) => [job.id, new JobRunState()])))
	const anyRunning = computed(() => [...runs.values()].some((state) => state.running))

	onMounted(() => {
		secret.value = sessionStorage.getItem(SECRET_STORAGE_KEY) ?? ''
	})

	watch(secret, (value) => {
		secretError.value = null
		sessionStorage.setItem(SECRET_STORAGE_KEY, value)
	})

	function stateOf(job: AdminJob): JobRunState {
		const state = runs.get(job.id)
		if (state === undefined) {
			throw new Error(`Unknown job: ${job.id}`)
		}
		return state
	}

	async function run(job: AdminJob): Promise<void> {
		if (secret.value === '') {
			secretError.value = 'Job secret is required to run jobs'
			return
		}
		const state = stateOf(job)
		state.running = true
		state.log = []
		try {
			const res = await fetch(`/api/admin/jobs/${job.endpoint}`, {
				method: 'POST',
				headers: { 'x-job-secret': secret.value },
			})
			if (!res.ok || res.body === null) {
				throw new Error(`HTTP ${res.status}`)
			}
			await readStream(res.body, state)
		} catch (error) {
			state.log.push(new JobLogLine(error instanceof Error ? error.message : String(error), false))
		} finally {
			state.running = false
		}
	}

	async function runMany(toRun: AdminJob[]): Promise<void> {
		for (const job of toRun) {
			await run(job)
		}
	}

	async function readStream(body: ReadableStream<Uint8Array>, state: JobRunState): Promise<void> {
		const reader = body.getReader()
		const decoder = new TextDecoder()
		let buffer = ''
		while (true) {
			const { done, value } = await reader.read()
			if (done) {
				return
			}
			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() ?? ''
			for (const line of lines) {
				const data = JSON.parse(line) as JobStreamLine
				state.log.push(new JobLogLine(data.message, data.type === 'complete' ? (data.success ?? false) : null))
			}
		}
	}

	return { secret, secretError, runs, anyRunning, run, runMany }
}
