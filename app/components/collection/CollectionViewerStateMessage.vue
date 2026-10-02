<script setup lang="ts">
defineProps<{ hasImages: boolean }>()
</script>

<template>
	<div
v-if="!hasImages" data-id="collection-viewer-state-message"
		class="text-muted pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
		<span>No images in this board.</span>
	</div>
</template>
