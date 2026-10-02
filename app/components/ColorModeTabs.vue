<script setup lang="ts">
const colorMode = useColorMode()

const items = [
	{ label: 'Light', value: 'light', icon: 'i-lucide-sun' },
	{ label: 'Dark', value: 'dark', icon: 'i-lucide-moon' },
	{ label: 'System', value: 'system', icon: 'i-lucide-monitor' },
]
</script>

<template>
	<UTabs
		v-model="colorMode.preference"
		data-id="color-mode-tabs"
		:items="items"
		:content="false"
		size="xs"
		aria-label="Color mode"
		:ui="{
			list: 'w-full bg-elevated/50 ring ring-default p-0.5',
			label: 'sr-only',
			trigger: 'p-1.5',
		}"
	/>
</template>
