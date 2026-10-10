<script setup lang="ts">
import type { AdminJob } from '~/types/adminJobs'

const list = useAdminJobsList()
const runner = useAdminJobRunner(list.jobs)

const selectedJob = ref<AdminJob | null>(list.jobs[0] ?? null)
const selectedLog = computed(() => (selectedJob.value ? runner.runs.get(selectedJob.value.id)!.log : []))

function runAndSelect(job: AdminJob): void {
	selectedJob.value = job
	void runner.run(job)
}

function runChecked(): void {
	const first = list.checkedJobs.value[0]
	if (first === undefined) {
		return
	}
	selectedJob.value = first
	void runner.runMany(list.checkedJobs.value)
}
</script>

<template>
	<div data-id="admin-jobs-view" class="flex h-full flex-col gap-4">
		<h1 class="text-highlighted text-xl font-semibold">Jobs</h1>
		<div class="flex min-h-0 flex-1 gap-4">
			<AdminJobsList
				v-model:filter="list.filter.value"
				v-model:secret="runner.secret.value"
				:jobs="list.filteredJobs.value"
				:runs="runner.runs"
				:selected-id="selectedJob?.id ?? null"
				:checked-ids="list.checkedIds.value"
				:all-checked="list.allChecked.value"
				:any-running="runner.anyRunning.value"
				:secret-error="runner.secretError.value"
				@select="selectedJob = $event"
				@toggle="list.toggle"
				@toggle-all="list.toggleAll"
				@run="runAndSelect"
				@run-checked="runChecked"
			/>
			<UCard class="min-w-0 flex-1 overflow-y-auto">
				<p v-if="selectedJob" class="text-highlighted mb-3 font-semibold">{{ selectedJob.name }}</p>
				<AdminJobLog :log="selectedLog" />
			</UCard>
		</div>
	</div>
</template>
