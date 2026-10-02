<script setup lang="ts">
const props = defineProps<{
	images: { id: string; url: string }[]
	size: 'big' | 'medium' | 'smol'
}>()

const itemGridClass = computed(() => {
	switch (props.size) {
		case 'big':
			return 'grid-cols-[repeat(2,2fr)_3fr] grid-rows-[3fr_1fr_2fr]'
		case 'medium':
			return 'grid-cols-[3fr_2fr] grid-rows-2'
		case 'smol':
			return ['grid-cols-2', 'grid-rows-2']
		default:
			throw new Error(`Unreachable code`)
	}
})

const imageClassByIndex = (index: number) => {
	if (props.size === 'big' && index === 0) {
		return ['col-span-2', 'row-span-2']
	}
	if (props.size === 'big' && index === 2) {
		return ['row-span-2']
	}
	if ((props.size === 'medium' || props.size === 'smol') && index === 0) {
		return ['row-span-2']
	}
	return []
}

const displayImages = computed(() => {
	if (props.size === 'big') {
		return props.images.slice(0, 5)
	}
	return props.images.slice(0, 3)
})
</script>

<template>
	<div
		v-if="displayImages.length"
		data-id="image-mosaic-grid"
		class="w-full flex items-stretch justify-center bg-muted/80 relative min-h-0 flex-1 p-0.5"
	>
		<div class="w-full h-full min-h-0 grid gap-0.5" :class="itemGridClass">
			<div
				v-for="(img, index) in displayImages"
				:key="img.id"
				class="min-h-0 overflow-hidden"
				:class="imageClassByIndex(index)"
			>
				<img :src="img.url" class="w-full h-full object-cover rounded-xs" alt="" @dragstart.prevent />
			</div>
		</div>
	</div>
	<div v-else data-id="image-mosaic-grid-empty" class="w-full h-full flex items-center justify-center">No images</div>
</template>
