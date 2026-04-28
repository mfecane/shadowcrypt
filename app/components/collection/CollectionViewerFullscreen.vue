<script setup lang="ts">
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'

const { fullscreenImage, bridge } = storeToRefs(useCollectionViewerStore())

const locked = ref(true)
const wrapperEl = ref<HTMLElement | null>(null)
let previousFocusedElement: HTMLElement | null = null

onMounted(() => {
	window.setTimeout(() => {
		locked.value = false
	}, 200)
})

watch(fullscreenImage, (image) => {
	if (!import.meta.client) {
		return
	}
	if (image !== null) {
		previousFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
		void nextTick(() => wrapperEl.value?.focus())
		return
	}
	previousFocusedElement?.focus()
	previousFocusedElement = null
})

function close(event: Event): void {
	if (locked.value) return
	event.preventDefault()
	bridge.value?.closeFullscreen()
}

function onPointerMove(event: PointerEvent): void {
	if (event.pointerType === 'touch') {
		event.preventDefault()
		bridge.value?.closeFullscreen()
	}
}

function onKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape') {
		close(event)
	}
}

const wrapperClass = computed(() => {
	return (
		'absolute z-30 h-screen w-screen bg-black/60 overflow-hidden flex items-center justify-center p-5' +
		(fullscreenImage.value ? '' : ' hidden')
	)
})

const imageStyle = computed(() => {
	const flipX = fullscreenImage.value?.layout.flipX === true ? -1 : 1
	const flipY = fullscreenImage.value?.layout.flipY === true ? -1 : 1

	return {
		transform: `scale(${flipX}, ${flipY})`,
	}
})
</script>

<template>
	<div
		ref="wrapperEl"
		:class="wrapperClass"
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-label="Fullscreen image viewer"
		@click="close"
		@keydown="onKeydown"
		@pointermove="onPointerMove"
		@touchmove="close"
	>
		<Transition>
			<div class="w-full h-full flex items-center justify-center" v-if="fullscreenImage">
				<img
					:src="fullscreenImage.src"
					:style="imageStyle"
					class="max-w-full max-h-full object-contain rounded-md shadow-md"
					alt=""
				/>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.v-enter-active {
	transition: transform 0.2s cubic-bezier(0.03, 1.1, 0.77, 1.1);
}

.v-leave-active {
	transition: transform 0.2s ease-in;
}

.v-enter-from,
.v-leave-to {
	transform: scale(0);
}
</style>
