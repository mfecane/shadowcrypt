<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { CollectionDetail } from '~/types/collections'

definePageMeta({
	auth: {
		unauthenticatedOnly: false,
		navigateUnauthenticatedTo: '/auth/gate',
	},
})

const route = useRoute()
const queryClient = useQueryClient()
const id = computed(() => route.params.id as string)

const { data, isPending: pending, error } = useQuery({
	queryKey: ['collection', id],
	queryFn: () => $fetch<{ collection: CollectionDetail }>(`/api/collections/${id.value}`),
})

watch(
	() => data.value?.collection,
	(col) => {
		if (col !== undefined && col !== null) {
			void queryClient.invalidateQueries({ queryKey: ['collections'] })
		}
	}
)

const collection = computed(() => data.value?.collection ?? null)

useHead({
	title: computed(() => collection.value?.name ?? 'Collection'),
})
</script>

<template>
	<div>
		<p v-if="pending" class="text-muted mx-auto max-w-6xl px-5 py-10 text-sm">Loading collection…</p>

		<p v-else-if="error" class="text-beige-400 mx-auto max-w-6xl px-5 py-10 text-lg font-medium">
			Collection not found or you do not have access.
		</p>

		<ClientOnly v-else-if="collection">
			<CollectionViewerRoot
				:key="`${collection.id}:${collection.images.map((i) => i.id).sort().join(',')}`"
				:detail="collection"
				:collection-id="collection.id"
			/>
		</ClientOnly>
	</div>
</template>
