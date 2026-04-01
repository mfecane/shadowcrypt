<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import type { ArchivedFolderSummary } from '~/types/collections'

const props = defineProps<{ folder: ArchivedFolderSummary }>()

const queryClient = useQueryClient()
const pending = ref(false)
const error = ref<string | null>(null)

async function unarchive(): Promise<void> {
	pending.value = true
	error.value = null
	try {
		await $fetch(`/api/folders/${props.folder.id}`, {
			method: 'PATCH',
			body: { archived: false },
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['folder', props.folder.id] })
	} catch {
		error.value = 'Could not unarchive'
	} finally {
		pending.value = false
	}
}
</script>

<template>
	<div
		class="border-muted bg-muted/20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3"
	>
		<span class="text-muted truncate text-sm font-medium">{{ folder.name }}</span>
		<div class="flex items-center gap-2">
			<span v-if="error !== null" class="text-red-400 text-xs">{{ error }}</span>
			<button
				type="button"
				class="bg-beige-600/80 hover:bg-beige-500 disabled:bg-muted rounded-md px-3 py-1.5 text-xs font-medium text-neutral-950 transition-colors disabled:cursor-not-allowed"
				:disabled="pending"
				@click="unarchive"
			>
				{{ pending ? '…' : 'Unarchive' }}
			</button>
		</div>
	</div>
</template>
