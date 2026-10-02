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
		class-name="rounded-full shadow-lg bg-default/70 backdrop-blur-sm border border-default/40"
	/>
</template>
