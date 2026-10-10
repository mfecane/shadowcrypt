<script setup lang="ts">
import type { AdminJob, JobRunState } from '~/types/adminJobs'

defineProps<{
	jobs: AdminJob[]
	runs: Map<string, JobRunState>
	selectedId: string | null
	checkedIds: Set<string>
	allChecked: boolean
	anyRunning: boolean
	secretError: string | null
}>()

const filter = defineModel<string>('filter', { required: true })
const secret = defineModel<string>('secret', { required: true })

defineEmits<{
	select: [job: AdminJob]
	toggle: [job: AdminJob]
	toggleAll: []
	run: [job: AdminJob]
	runChecked: []
}>()
</script>

<template>
	<UCard data-id="admin-jobs-list" class="w-lg shrink-0">
		<div class="space-y-3">
			<UFormField label="Job secret" :error="secretError ?? undefined">
				<UInput v-model="secret" type="password" placeholder="Required to run jobs" class="w-full" />
			</UFormField>

			<div class="flex items-center gap-3">
				<UCheckbox
					:model-value="allChecked"
					label="Select all"
					class="shrink-0"
					@update:model-value="$emit('toggleAll')"
				/>
				<UInput v-model="filter" placeholder="Filter jobs..." icon="i-lucide-search" class="flex-1" />
			</div>

			<p v-if="jobs.length === 0" class="text-muted text-sm">No jobs match filter</p>
			<AdminJobCard
				v-for="job in jobs"
				:key="job.id"
				:job="job"
				:state="runs.get(job.id)!"
				:selected="selectedId === job.id"
				:checked="checkedIds.has(job.id)"
				:disabled="anyRunning"
				@select="$emit('select', job)"
				@toggle="$emit('toggle', job)"
				@run="$emit('run', job)"
			/>

			<UButton v-if="checkedIds.size > 0" block :disabled="anyRunning" @click="$emit('runChecked')">
				Run selected ({{ checkedIds.size }})
			</UButton>
		</div>
	</UCard>
</template>
