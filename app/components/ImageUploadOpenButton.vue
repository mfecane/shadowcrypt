<script setup lang="ts">
const route = useRoute()
const { open, openOverlay } = useImageUploadOverlay()

const show = computed(() => {
	const p = route.path
	const onPage = p === '/list' || /^\/list\/[^/]+$/.test(p) || /^\/collections\/[^/]+$/.test(p)
	return onPage && !open.value
})
</script>

<template>
	<button
		v-show="show"
		type="button"
		class="border-beige-600/30 bg-beige-600 hover:bg-beige-500 focus-visible:ring-beige-500/50 fixed bottom-6 right-6 z-200 flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
		aria-label="Add image to collection"
		@click="openOverlay"
	>
		<span class="i-lucide-plus text-neutral-950 block h-7 w-7" aria-hidden="true" />
	</button>
</template>
