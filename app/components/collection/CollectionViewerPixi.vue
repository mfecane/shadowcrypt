<script setup lang="ts">
import type { CollectionDetail } from '~/types/collections'
import { useCollectionViewerStore } from '~/stores/collectionViewer'

const props = defineProps<{ collection: CollectionDetail }>()

const store = useCollectionViewerStore()

const containerEl = ref<HTMLDivElement>()
onMounted(() => {
	const el = containerEl.value
	if (!el) {
		return
	}
	void store.createBoard(el, props.collection).then(() => {
		store.setLoading(false)
	})
})

onBeforeUnmount(() => {
	store.destroyBoard()
})
</script>

<template>
	<div ref="containerEl" class="absolute top-0 left-0 w-full h-full overflow-hidden" />
</template>
