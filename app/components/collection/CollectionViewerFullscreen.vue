<script setup lang="ts">
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'

const { fullscreenImage, bridge } = storeToRefs(useCollectionViewerStore())

const locked = ref(true)

onMounted(() => {
	window.setTimeout(() => {
		locked.value = false
	}, 200)
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

const wrapperClass = computed(() => {
	return (
		'absolute z-30 h-screen w-screen bg-black/60 overflow-hidden flex items-center justify-center p-5' +
		(fullscreenImage.value ? '' : ' hidden')
	)
})
</script>

<template>
	<div :class="wrapperClass" @click="close" @pointermove="onPointerMove" @touchmove="close">
		<Transition>
			<div class="w-full h-full flex items-center justify-center" v-if="fullscreenImage">
				<img
					:src="fullscreenImage.src"
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
