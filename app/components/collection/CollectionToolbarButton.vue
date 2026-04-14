<script setup lang="ts">
defineProps<{
	icon: string
	disabled?: boolean
	tooltip?: string
	spin?: boolean
}>()
</script>

<template>
	<UTooltip :text="tooltip" :content="{ side: 'bottom', align: 'start' }">
		<UButton
			variant="ghost"
			class="rounded-m h-8 w-8 p-2 disabled:text-beige-600"
			:disabled="disabled"
			:aria-label="tooltip"
		>
			<Icon :name="icon" class="h-4 w-4" :class="spin ? 'animate-spin' : ''" />
		</UButton>
	</UTooltip>
</template>
