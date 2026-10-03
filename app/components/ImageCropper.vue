<script setup lang="ts">
import type { CropArea } from '~~/lib/imageCropper/types'

const props = defineProps<{
	image: string
	/** null = freeform crop rect, otherwise the rect keeps this width/height ratio while resizing. */
	aspectRatio: number | null
}>()

const emit = defineEmits<{
	cropComplete: [area: CropArea]
}>()

const imageRef = toRef(props, 'image')
const aspectRatioRef = toRef(props, 'aspectRatio')

const { containerEl, canvasAspectRatio } = useImageCropper(imageRef, aspectRatioRef, (area) => emit('cropComplete', area))
</script>

<template>
	<div
		data-id="image-cropper"
		ref="containerEl"
		class="relative mx-auto h-full max-w-full overflow-hidden rounded-md bg-black"
		:style="canvasAspectRatio !== null ? { aspectRatio: canvasAspectRatio } : undefined"
	/>
</template>
