<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { CollectionDetail } from '~/types/collections'

const { createBoard, unsubscribe } = useBoard()

const props = defineProps<{ collection: CollectionDetail }>()

const store = useCollectionViewerStore()

const state = storeToRefs(store)

const queryClient = useQueryClient()

const containerEl = ref<HTMLDivElement>()

let unsubscribePersist: (() => void) | null = null

watch(state.board, (b) => {
	unsubscribePersist =
		b?.bridge.subscribeOnPersistSuccess(() => {
			const cid = props.collection.id
			void queryClient.invalidateQueries({ queryKey: ['collection', cid] })
			void queryClient.invalidateQueries({ queryKey: ['collections'] })
		}) ?? null
})

onMounted(() => {
	const el = containerEl.value
	if (!el) return
	createBoard(el, props.collection)
})

onBeforeUnmount(() => {
	state.board.value?.destroy()
	store.reset()
	unsubscribe?.()
	unsubscribePersist?.()
})
</script>

<template>
	<div ref="containerEl" class="absolute top-0 left-0 w-full h-full overflow-hidden" />
</template>
