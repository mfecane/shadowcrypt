<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { collectionsQueryKey } from '~/composables/useCollectionsListQuery'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { CollectionMeta } from '~/types/collections'
import type { BoardDetail } from '~/types/boards'

definePageMeta({
	auth: {
		unauthenticatedOnly: false,
		navigateUnauthenticatedTo: '/auth/gate',
	},
})

const route = useRoute()
const queryClient = useQueryClient()
const collectionId = computed(() => route.params.id as string)
const boardId = computed(() => route.params.boardId as string)

const {
	data: collectionData,
	isPending: collectionPending,
	error: collectionError,
} = useQuery({
	queryKey: ['collection', collectionId],
	queryFn: () => $fetch<{ collection: CollectionMeta }>(`/api/collections/${collectionId.value}`),
})

const {
	data: boardData,
	isPending: boardPending,
	error: boardError,
} = useQuery({
	queryKey: ['board', boardId],
	queryFn: () => $fetch<{ board: BoardDetail }>(`/api/boards/${boardId.value}`),
	// The live Board owns state while mounted; other boards change behind its back (drag-out moves),
	// so never mount a board from cache.
	gcTime: 0,
})

let hasLoadedBoardOnce = false

watch(
	() => boardData.value?.board,
	(board) => {
		if (board === undefined || board === null) {
			return
		}
		if (!hasLoadedBoardOnce) {
			hasLoadedBoardOnce = true
			return
		}
		void queryClient.invalidateQueries({ queryKey: collectionsQueryKey })
	}
)

const collection = computed(() => collectionData.value?.collection ?? null)
const board = computed(() => boardData.value?.board ?? null)

const viewerStore = useCollectionViewerStore()

function viewerKeyFor(id: string, imageIds: string[]): string {
	return `${id}:${[...imageIds].sort().join(',')}`
}

// Remount the viewer only when the server image set differs from the live board
// (e.g. upload); a refetch after an in-viewer removal / drag-out must not remount.
const viewerKey = ref<string | null>(null)
watch(
	board,
	(b) => {
		if (b === null) {
			return
		}
		const next = viewerKeyFor(b.id, b.images.map((i) => i.id))
		const live = viewerStore.board
		if (viewerKey.value !== null && live !== null && viewerKeyFor(live.bridge.boardId ?? '', live.getImageIds()) === next) {
			return
		}
		viewerKey.value = next
	},
	{ immediate: true }
)
const pending = computed(() => collectionPending.value || boardPending.value)
const error = computed(() => collectionError.value ?? boardError.value)

useHead({
	title: computed(() => board.value?.name ?? 'Collection'),
})
</script>

<template>
	<div>
		<div
v-if="pending" class="text-muted mx-auto flex max-w-6xl items-center justify-center gap-2 px-5 py-10 text-sm"
			aria-live="polite" aria-busy="true">
			<Icon name="i-lucide-loader-2" class="h-4 w-4 animate-spin" />
			<span>Loading collection…</span>
		</div>

		<p v-else-if="error" class="text-primary mx-auto max-w-6xl px-5 py-10 text-lg font-medium">
			Collection not found or you do not have access.
		</p>

		<ClientOnly v-else-if="collection && board">
			<CollectionViewerRoot
				:key="viewerKey ?? board.id"
				:collection="collection"
				:board="board"
			/>
		</ClientOnly>
	</div>
</template>
