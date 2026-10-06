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
		data-id="archived-collection-card"
		class="border-muted bg-elevated flex flex-col gap-1 overflow-hidden rounded-md border p-1 shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)]"
	>
		<NuxtLink :to="`/collections/${collection.id}`" class="grid h-[90px] grid-cols-3 gap-1">
			<div v-for="n in 3" :key="n" class="bg-muted/60 min-w-0 overflow-hidden rounded-sm">
				<img
					v-if="collection.images[n - 1]"
					:src="collection.images[n - 1]?.url"
					class="h-full w-full object-cover"
					alt=""
					@dragstart.prevent
				/>
			</div>
		</NuxtLink>

		<div class="flex items-center justify-between gap-2 px-0.5">
			<div class="min-w-0">
				<div class="text-highlighted truncate text-base font-medium">{{ collection.name }}</div>
				<div class="text-primary text-xs font-medium">{{ collection.imageCount }} items</div>
				<span v-if="error !== null" class="text-error text-xs">{{ error }}</span>
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
	</div>
</template>
