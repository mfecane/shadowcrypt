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
	<UCard class="flex flex-col items-start gap-3">
		<UBadge color="neutral" variant="soft" size="sm">Archived</UBadge>
		<div class="min-w-0">
			<p class="truncate text-base font-medium text-highlighted">{{ collection.name }}</p>
		</div>
		<UBadge color="primary" variant="soft" size="sm">{{ collection.imageCount }} items</UBadge>
		<span v-if="error !== null" class="text-error text-xs">{{ error }}</span>
		<UButton
			variant="soft"
			color="neutral"
			leading-icon="i-lucide-archive-restore"
			size="sm"
			:disabled="pending"
			@click="unarchive"
		>
			{{ pending ? '…' : 'Unarchive' }}
		</UButton>
	</UCard>
</template>
