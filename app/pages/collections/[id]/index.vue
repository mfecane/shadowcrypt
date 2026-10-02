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

const { data, isPending: pending, error } = useQuery({
	queryKey: ['collection', id],
	queryFn: () => $fetch<{ collection: CollectionMeta }>(`/api/collections/${id.value}`),
})

watch(
	() => data.value?.collection,
	(col) => {
		if (col === undefined || col === null) {
			return
		}
		const target = col.boards.find((b) => b.isDefault) ?? col.boards[0]
		if (target === undefined) {
			return
		}
		void navigateTo(`/collections/${col.id}/boards/${target.id}`, { replace: true })
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
