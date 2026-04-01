<script setup lang="ts">
defineProps<{
	icon: string
	disabled?: boolean
	ariaLabel?: string
}>()
</script>

<template>
	<UButton
		variant="ghost"
		class="rounded-m h-8 w-8 p-2 disabled:text-beige-600"
		:disabled="disabled"
		:aria-label="ariaLabel"
	>
		<Icon :name="icon" class="h-4 w-4" />
	</UButton>
</template>
