<script setup lang="ts">
const route = useRoute()
const { open, openModal } = useImageUploadModal()

const show = computed(() => {
	const p = route.path
	const onPage = p === '/list' || /^\/list\/[^/]+$/.test(p) || /^\/collections\/[^/]+$/.test(p)
	return onPage && !open.value
})
</script>

<template>
	<div v-show="show">
		<UButton
			color="primary"
			variant="solid"
			square
			class="fixed right-6 bottom-6 z-50 rounded-full shadow-lg"
			aria-label="Add image to collection"
			@click="openModal"
		>
			<Icon name="i-lucide-plus" class="h-7 w-7" aria-hidden="true" />
		</UButton>
		<ImageUploadModal />
	</div>
</template>
