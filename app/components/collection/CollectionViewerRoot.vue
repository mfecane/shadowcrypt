<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { CollectionDetail } from '~/types/collections'

const props = defineProps<{ detail: CollectionDetail; collectionId: string }>()

const store = useCollectionViewerStore()
const { loading } = storeToRefs(store)

function onWindowWheel(event: WheelEvent): void {
	if (event.ctrlKey || event.metaKey) {
		event.preventDefault()
	}
}

function onWindowKeyDown(event: KeyboardEvent): void {
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

watch(
	() => props.detail,
	() => {
		store.setLoading(false)
	},
	{ immediate: true }
)

onBeforeUnmount(() => {
	window.removeEventListener('wheel', onWindowWheel, { capture: true })
	window.removeEventListener('keydown', onWindowKeyDown, { capture: true })
	window.removeEventListener('gesturestart', onGestureEvent)
	window.removeEventListener('gesturechange', onGestureEvent)
	window.removeEventListener('gestureend', onGestureEvent)
	store.clear()
})

onMounted(() => {
	window.addEventListener('wheel', onWindowWheel, { passive: false, capture: true })
	window.addEventListener('keydown', onWindowKeyDown, { capture: true })
	window.addEventListener('gesturestart', onGestureEvent, { passive: false })
	window.addEventListener('gesturechange', onGestureEvent, { passive: false })
	window.addEventListener('gestureend', onGestureEvent, { passive: false })
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
