<script setup lang="ts">
import type { JobLogLine } from '~/types/adminJobs'

defineProps<{ log: JobLogLine[] }>()
</script>

<template>
	<div data-id="admin-job-log" class="space-y-1 font-mono text-sm">
		<p v-if="log.length === 0" class="text-muted">No runs yet. Click the play icon on a job to start.</p>
		<p
			v-for="(line, i) in log"
			:key="i"
			:class="line.success === null ? 'text-default' : line.success ? 'text-success' : 'text-error'"
		>
			{{ line.message }}
		</p>
	</div>
</template>
