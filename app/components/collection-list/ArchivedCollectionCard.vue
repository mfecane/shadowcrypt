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
	<UCard
		:ui="{
			body: 'space-y-3',
		}"
	>
		<div class="flex items-center justify-between gap-2">
			<p class="truncate text-base font-medium text-highlighted">{{ collection.name }}</p>
			<UBadge color="primary" variant="soft" size="sm">{{ collection.imageCount }} items</UBadge>
		</div>
		<UButton
			variant="soft"
			color="primary"
			leading-icon="i-lucide-archive-restore"
			size="sm"
			:disabled="pending"
			@click="unarchive"
		>
			{{ pending ? '…' : 'Unarchive' }}
		</UButton>
		<span v-if="error !== null" class="text-error text-xs">{{ error }}</span>
	</UCard>
</template>
