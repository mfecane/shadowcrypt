export class AdminJob {
	public constructor(
		public readonly id: string,
		public readonly name: string,
		public readonly description: string,
		public readonly endpoint: string
	) {}

	public matches(filter: string): boolean {
		const needle = filter.toLowerCase()
		return this.name.toLowerCase().includes(needle) || this.description.toLowerCase().includes(needle)
	}
}

export class JobLogLine {
	public constructor(
		public readonly message: string,
		/** null while the job is still in progress */
		public readonly success: boolean | null
	) {}
}

export class JobRunState {
	public running = false

	public log: JobLogLine[] = []

	/** Result of the last finished run; null when never finished. */
	public get success(): boolean | null {
		return this.log[this.log.length - 1]?.success ?? null
	}
}
