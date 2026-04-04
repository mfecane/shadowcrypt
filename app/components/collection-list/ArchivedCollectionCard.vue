<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import type { CollectionListItem } from '~/types/collections'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const props = defineProps<{ collection: CollectionListItem }>()

const queryClient = useQueryClient()
const pending = ref(false)
const error = ref<string | null>(null)

async function unarchive(): Promise<void> {
	pending.value = true
	error.value = null
	try {
		await $fetch(`/api/collections/${props.collection.id}`, {
			method: 'PATCH',
			body: { archived: false },
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', props.collection.id] })
		if (props.collection.folderId !== null) {
			await queryClient.invalidateQueries({ queryKey: ['folder', props.collection.folderId] })
		}
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Could not unarchive')
	} finally {
		pending.value = false
	}
}
</script>

<template>
	<div class="flex flex-col gap-2 border border-muted bg-elevated p-4 rounded-lg items-start">
		<span class="text-muted text-xs font-medium uppercase tracking-wide">Archived</span>
		<span class="truncate text-base font-medium text-highlighted">{{ collection.name }}</span>
		<div class="text-beige-500 text-xs font-medium">{{ collection.imageCount }} items</div>
		<span v-if="error !== null" class="text-red-400 text-xs">{{ error }}</span>
		<UButton variant="soft" icon="i-lucide-archive-restore" size="sm" :disabled="pending" @click="unarchive">
			{{ pending ? '…' : 'Unarchive' }}
		</UButton>
	</div>
</template>
