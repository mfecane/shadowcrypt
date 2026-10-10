<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore';
import type { BoardDetail } from '~/types/boards';
import type { CollectionMeta } from '~/types/collections';

const props = defineProps<{ collection: CollectionMeta; board: BoardDetail }>()

const store = useCollectionViewerStore()
const { loading, autoLayoutPending, dragOut } = storeToRefs(store)
const { openModal: openImageUploadModal } = useImageUploadModal()

const open = useState('collectionSidebarOpen', () => false)
const reorderingBoards = ref(false)

watch(dragOut, (next, prev) => {
	if (next !== null && prev === null) {
		open.value = true
	}
})

// Post flush: board cards must be in the DOM before the drop-target candidates are rebuilt.
watch(open, () => {
	store.board?.refreshDropTargets()
}, { flush: 'post' })

function onWindowWheel(event: WheelEvent): void {
	if (event.ctrlKey || event.metaKey) {
		event.preventDefault()
	}
}

function onGestureEvent(event: Event): void {
	event.preventDefault()
}

onBeforeUnmount(() => {
	window.removeEventListener('wheel', onWindowWheel, { capture: true })
	window.removeEventListener('gesturestart', onGestureEvent)
	window.removeEventListener('gesturechange', onGestureEvent)
	window.removeEventListener('gestureend', onGestureEvent)
})

onMounted(() => {
	// Without images CollectionViewerPixi is not mounted, so nothing else would clear loading.
	if (props.board.images.length === 0) {
		store.setLoading(false)
	}

	window.addEventListener('wheel', onWindowWheel, { passive: false, capture: true })
	window.addEventListener('gesturestart', onGestureEvent, { passive: false })
	window.addEventListener('gesturechange', onGestureEvent, { passive: false })
	window.addEventListener('gestureend', onGestureEvent, { passive: false })
})
</script>

<template>
	<div class="fixed inset-0 z-0 flex">
		<div class="flex-1 flex flex-col relative">
			<CollectionToolbar />

			<CollectionBottombar @open-image-upload-modal="openImageUploadModal" />

			<div class="absolute flex gap-2 items-center right-2 top-2 z-20">
				<UserAvatarMenu class="hidden sm:block" />
				<UTooltip text="View boards">
					<UButton v-if="!open" icon="i-lucide-panel-right-open" size="md" color="neutral" variant="soft"
						class="rounded-full" @click="() => { open = true }" />
				</UTooltip>
			</div>

			<UButton class="hidden sm:inline-flex absolute right-2 bottom-2 z-20" icon="i-lucide-plus"
				@click="openImageUploadModal">
				Add to collection
			</UButton>
		</div>

		<USidebar v-model:open="open" collapsible="offcanvas" rail side="right" close-icon="i-lucide-panel-right-close"
			:ui="{
				container: 'h-full',
				inner: 'bg-elevated/25 divide-transparent',
				body: 'py-0',
			}">
			<template #header>
				<div data-id="boards-sidebar-header" class="flex w-full items-center justify-between">
					<UButton icon="i-lucide-panel-right-close" size="md" color="neutral" variant="ghost"
						@click="() => { open = false }" />
					<div class="flex items-center gap-1">
						<CollectionNewBoardButton :collection-id="collection.id" />
						<UTooltip :text="reorderingBoards ? 'Finish reordering boards' : 'Reorder boards'">
							<UButton data-id="boards-reorder-toggle" icon="i-lucide-arrow-up-down" size="md"
								:color="reorderingBoards ? 'primary' : 'neutral'"
								:variant="reorderingBoards ? 'solid' : 'ghost'" :aria-pressed="reorderingBoards"
								@click="() => { reorderingBoards = !reorderingBoards }" />
						</UTooltip>
					</div>
				</div>
			</template>
			<CollectionBoardsSidebar :collection-id="collection.id" :collection-name="collection.name"
				:boards="collection.boards" :active-board-id="board.id"
				v-model:reordering="reorderingBoards" />
		</USidebar>

		<CollectionViewerFullscreen />

		<CollectionImageDragGhost />

		<CollectionViewerStateMessage :has-images="board.images.length > 0" />

		<CollectionAutoLayoutPendingOverlay v-if="autoLayoutPending" />

		<div v-if="loading" data-id="board-loading-overlay"
			class="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm"
			aria-live="polite" aria-busy="true">
			<Icon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-toned" />
		</div>

		<CollectionViewerPixi v-if="board.images.length > 0" :board="board" />
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