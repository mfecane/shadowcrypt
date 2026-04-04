<script setup lang="ts">
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'

const { fullscreenImage, bridge } = storeToRefs(useCollectionViewerStore())

const fitClass = computed(() => {
	const im = fullscreenImage.value
	if (!im) {
		return 'fit-vertically'
	}
	const aspect = im.width / im.height
	return aspect > window.innerWidth / window.innerHeight ? 'fit-horizontally' : 'fit-vertically'
})

function close(event: Event): void {
	event.preventDefault()
	bridge.value?.closeFullscreen()
}

function onPointerMove(event: PointerEvent): void {
	if (event.pointerType === 'touch') {
		event.preventDefault()
		bridge.value?.closeFullscreen()
	}
}
</script>

<template>
	<div class="fullscreen" @click="close" @pointermove="onPointerMove" @touchmove="close">
		<Transition>
			<img v-if="fullscreenImage" :src="fullscreenImage.src" :class="fitClass" alt="" />
		</Transition>
	</div>
</template>

<style scoped>
.fullscreen {
	display: none;
	pointer-events: none;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	position: absolute;
	z-index: 3;
	background: rgba(0, 0, 0, 0.6);
	overflow: hidden;
	align-items: center;
	justify-content: center;
}

.fullscreen img {
	border-radius: 5px;
	transform: scale(0.95);
	border: 1px solid black;
	box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.6);
}

.fullscreen:has(img) {
	display: flex;
	pointer-events: all;
}

.fit-horizontally {
	width: 100%;
}

.fit-vertically {
	height: 100%;
}

.fullscreen img.v-enter-active {
	transition: transform 0.2s cubic-bezier(0.03, 1.1, 0.77, 1.1);
}

.fullscreen img.v-leave-active {
	transition: transform 0.2s ease-in;
}

.fullscreen img.v-enter-from,
.fullscreen img.v-leave-to {
	transform: scale(0);
}
</style>
