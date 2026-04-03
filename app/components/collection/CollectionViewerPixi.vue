<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import type { CollectionDetail } from '~/types/collections'
import { useCollectionViewerStore } from '~/stores/collectionViewer'

const props = defineProps<{ collection: CollectionDetail }>()

const store = useCollectionViewerStore()
const queryClient = useQueryClient()

const containerEl = ref<HTMLDivElement>()
onMounted(() => {
	const el = containerEl.value
	if (!el) {
		return
	}
	const cid = props.collection.id
	void store
		.createBoard(el, props.collection, () => {
			void queryClient.invalidateQueries({ queryKey: ['collection', cid] })
			void queryClient.invalidateQueries({ queryKey: ['collections'] })
		})
		.then(() => {
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
