<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { CollectionDetail } from '~/types/collections'

const props = defineProps<{ detail: CollectionDetail; collectionId: string }>()

const store = useCollectionViewerStore()
const { loading } = storeToRefs(store)

watch(
	() => props.detail,
	() => {
		store.setLoading(false)
	},
	{ immediate: true }
)

onBeforeUnmount(() => {
	store.clear()
})
</script>

<template>
	<div class="fixed inset-0 z-40">
		<CollectionViewerFullscreen />
		<CollectionToolbar />
		<div v-if="loading" class="text-muted pointer-events-none absolute left-1/2 top-40 -translate-x-1/2 text-sm">
			Loading…
		</div>
		<p
			v-else-if="detail.images.length === 0"
			class="text-muted pointer-events-none absolute left-1/2 top-40 -translate-x-1/2 text-sm"
		>
			No images in this collection.
		</p>
		<CollectionViewerPixi v-else :collection="detail" />
	</div>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
	transition: opacity 0.4s ease;
}

.v-enter-from,
.v-leave-to {
	opacity: 0;
}
</style>
