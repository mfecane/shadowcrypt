<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { BoardDetail } from '~/types/boards'

const { createBoard, disposeBoard } = useBoard()

const props = defineProps<{ board: BoardDetail }>()

const store = useCollectionViewerStore()

const state = storeToRefs(store)

const queryClient = useQueryClient()

const containerEl = ref<HTMLDivElement>()

const toast = useToast()

let unsubscribePersist: (() => void) | null = null
let unsubscribeImageMoved: (() => void) | null = null
let unsubscribeDragOutError: (() => void) | null = null

watch(state.board, (b) => {
	unsubscribePersist?.()
	unsubscribeImageMoved?.()
	unsubscribeDragOutError?.()
	unsubscribePersist =
		b?.bridge.subscribeOnPersistSuccess(() => {
			const bid = props.board.id
			void queryClient.invalidateQueries({ queryKey: ['board', bid] })
		}) ?? null

	unsubscribeImageMoved =
		b?.bridge.subscribeOnImageMovedToBoard(() => {
			void queryClient.invalidateQueries({ queryKey: ['collection', props.board.collectionId] })
			toast.add({ title: 'Image moved', description: 'Moved to the other board.', icon: 'i-lucide-check', color: 'success' })
		}) ?? null

	unsubscribeDragOutError =
		b?.bridge.subscribeOnDragOutError((message) => {
			toast.add({ title: 'Could not move image', description: message, icon: 'i-lucide-triangle-alert', color: 'error' })
		}) ?? null
})

onMounted(() => {
	const el = containerEl.value
	if (!el) return
	void createBoard(el, props.board, props.board.collectionId)
})

onBeforeUnmount(() => {
	disposeBoard()
	unsubscribePersist?.()
	unsubscribeImageMoved?.()
	unsubscribeDragOutError?.()
})
</script>

<template>
	<div ref="containerEl" class="absolute top-0 left-0 w-full h-full overflow-hidden" />
</template>
