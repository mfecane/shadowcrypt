<script setup lang="ts">
import type { AdminJob, JobRunState } from '~/types/adminJobs'

const props = defineProps<{
	job: AdminJob
	state: JobRunState
	selected: boolean
	checked: boolean
	disabled: boolean
}>()

defineEmits<{ select: []; toggle: []; run: [] }>()

const statusIcon = computed(() => {
	if (props.state.running) return 'i-lucide-loader-circle'
	if (props.state.success === true) return 'i-lucide-circle-check'
	if (props.state.success === false) return 'i-lucide-circle-alert'
	return 'i-lucide-circle'
})

const statusClass = computed(() => {
	if (props.state.running) return 'text-info animate-spin'
	if (props.state.success === true) return 'text-success'
	if (props.state.success === false) return 'text-error'
	return 'text-muted'
})
</script>

<template>
	<div
		data-id="admin-job-card"
		class="border-default flex items-center gap-3 rounded-md border p-3"
		:class="selected ? 'bg-elevated' : ''"
	>
		<UCheckbox :model-value="checked" @update:model-value="$emit('toggle')" />
		<button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="$emit('select')">
			<span class="flex items-center gap-2">
				<UIcon :name="statusIcon" class="size-4 shrink-0" :class="statusClass" />
				<span class="text-highlighted truncate text-sm font-medium">{{ job.name }}</span>
			</span>
			<span class="text-muted block truncate text-xs">{{ job.description }}</span>
		</button>
		<UButton
			icon="i-lucide-play"
			color="neutral"
			variant="ghost"
			size="sm"
			:disabled="disabled"
			aria-label="Run this job"
			@click="$emit('run')"
		/>
	</div>
</template>
