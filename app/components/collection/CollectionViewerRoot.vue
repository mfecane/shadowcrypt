<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore';
import type { BoardDetail } from '~/types/boards';
import type { CollectionMeta } from '~/types/collections';

const props = defineProps<{ collection: CollectionMeta; board: BoardDetail }>()

const store = useCollectionViewerStore()
const { loading, autoLayoutPending, dragOut } = storeToRefs(store)
const { openModal: openImageUploadModal } = useImageUploadModal()

const open = ref(true)

watch(dragOut, (next, prev) => {
	if (next !== null && prev === null) {
		open.value = true
	}
})

watch(open, () => {
	store.board?.refreshDropTargets()
})

function onWindowWheel(event: WheelEvent): void {
	if (event.ctrlKey || event.metaKey) {
		event.preventDefault()
	}
}

function onWindowKeyDown(event: KeyboardEvent): void {
	if (event.key === 'Escape' && dragOut.value !== null) {
		store.board?.cancelImageDragOut()
		return
	}
	if (!event.ctrlKey && !event.metaKey) {
		return
	}
	if (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '_' || event.key === '0') {
		event.preventDefault()
	}
}

function onGestureEvent(event: Event): void {
	event.preventDefault()
}

onBeforeUnmount(() => {
	window.removeEventListener('wheel', onWindowWheel, { capture: true })
	window.removeEventListener('keydown', onWindowKeyDown, { capture: true })
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
	window.addEventListener('keydown', onWindowKeyDown, { capture: true })
	window.addEventListener('gesturestart', onGestureEvent, { passive: false })
	window.addEventListener('gesturechange', onGestureEvent, { passive: false })
	window.addEventListener('gestureend', onGestureEvent, { passive: false })
})
</script>

<template>
	<div class="fixed inset-0 z-0 flex">
		<div class="flex-1 flex flex-col relative">
			<CollectionToolbar />


			<div class="absolute flex gap-2 items-center right-2 top-2 z-20">
				<UserAvatarMenu />
				<UTooltip text="View boards">
					<UButton
v-if="!open" icon="i-lucide-panel-right-open" size="md" color="neutral" variant="ghost"
						@click="open = true" />
				</UTooltip>
			</div>


			<div class="absolute right-2 bottom-2 z-20">
				<UButton icon="i-lucide-plus" @click="openImageUploadModal">Add to collection</UButton>
			</div>

			<CollectionViewerStateMessage :has-images="board.images.length > 0" />
		</div>


		<USidebar
v-model:open="open" collapsible="offcanvas" rail side="right" close-icon="i-lucide-panel-right-close"
			:ui="{
				container: 'h-full',
				inner: 'bg-elevated/25 divide-transparent',
				body: 'py-0',
			}">
			<template #header>
				<UButton
icon="i-lucide-panel-right-close" size="md" color="neutral" variant="ghost"
					@click="open = false" />
			</template>
			<CollectionBoardsSidebar
:collection-id="collection.id" :collection-name="collection.name"
				:boards="collection.boards" :active-board-id="board.id" />
		</USidebar>
		<CollectionViewerFullscreen />
		<CollectionImageDragGhost />
		<div
v-if="autoLayoutPending"
			class="absolute inset-0 z-5 flex items-center justify-center bg-black/55 backdrop-blur-[2px]"
			aria-live="polite" aria-busy="true">
			<div class="border-muted bg-elevated flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl">
				<Icon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-toned" />
				<div>
					<p class="text-highlighted text-sm font-medium">Auto-layout in progress</p>
					<p class="text-muted text-xs">Interactions are temporarily disabled.</p>
				</div>
			</div>
		</div>
		<div
v-if="loading" data-id="board-loading-overlay"
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
