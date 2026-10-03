<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import type { CollectionMeta } from '~/types/collections'

definePageMeta({
	auth: {
		unauthenticatedOnly: false,
		navigateUnauthenticatedTo: '/auth/gate',
	},
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data, isPending: pending, isFetching, error } = useQuery({
	queryKey: ['collection', id],
	queryFn: () => $fetch<{ collection: CollectionMeta }>(`/api/collections/${id.value}`),
	// Cached `currentBoardId` may predate the last board visit.
	staleTime: 0,
})

watch(
	[() => data.value?.collection, isFetching],
	([col, fetching]) => {
		if (col === undefined || fetching) {
			return
		}
		const targetId = col.currentBoardId ?? col.boards[0]?.id
		if (targetId === undefined) {
			throw new Error(`collection ${col.id} has no boards`)
		}
		void navigateTo(`/collections/${col.id}/boards/${targetId}`, { replace: true })
	},
	{ immediate: true }
)
</script>

<template>
	<div>
		<p v-if="pending" class="text-muted mx-auto max-w-6xl px-5 py-10 text-sm">Loading collection…</p>

		<p v-else-if="error" class="text-primary mx-auto max-w-6xl px-5 py-10 text-lg font-medium">
			Collection not found or you do not have access.
		</p>
	</div>
</template>
