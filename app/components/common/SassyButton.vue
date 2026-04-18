<script setup lang="ts">
defineProps<{
	icon: string
	onClick: () => void
	uiClass?: string
}>()
</script>

<template>
	<UButton
		:icon="icon"
		@click="onClick"
		:class="uiClass"
		class-name="rounded-full shadow-lg bg-neutral-900/70 backdrop-blur-sm border border-neutral-700/40"
	/>
</template>
