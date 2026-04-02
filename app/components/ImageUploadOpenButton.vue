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
	<div v-show="show">
		<UButton
			variant="ghost"
			class="hover:border-neutral-100 hover:bg-muted/50 hover:text-neutral-100 hover:shadow-md hover:shadow-neutral-100/20 border-beige-400 text-beige-400 bg-muted/50 backdrop-blur-md fixed bottom-6 right-6 z-200 flex h-12 w-12 items-center justify-center rounded-full border shadow-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
			aria-label="Add image to collection"
			@click="openOverlay"
		>
			<Icon name="i-lucide-plus" class="h-7 w-7" aria-hidden="true" />
		</UButton>
	</div>
</template>
