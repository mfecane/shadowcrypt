<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import type { CollectionListItem } from '~/types/collections';
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage';

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
	<div
		class="border-muted bg-elevated flex h-[160px] min-h-0 flex-col overflow-hidden rounded-md border relative shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)]"
	>
		<ImageMosaicGrid :images="collection.images" size="smol" class="absolute inset-0 h-full w-full" />

		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent"
		/>

		<div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-2">
			<div class="min-w-0">
				<div class="truncate text-sm font-medium text-white drop-shadow">{{ collection.name }}</div>
				<div class="text-xs font-medium text-white/80 drop-shadow">{{ collection.imageCount }} items</div>
			</div>
			<UButton
				variant="soft"
				color="primary"
				icon="i-lucide-archive-restore"
				size="xs"
				square
				:loading="pending"
				:disabled="pending"
				class="shrink-0"
				@click="unarchive"
			/>
		</div>
		<span v-if="error !== null" class="absolute top-1 left-1 text-error text-xs bg-default/80 rounded px-1">{{
			error
		}}</span>
	</div>
</template>
