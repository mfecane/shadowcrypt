<script setup lang="ts">
defineProps<{
	icon: string
	disabled?: boolean
	tooltip?: string
	spin?: boolean
	/** Extra classes on the icon (e.g. success/error tone on the save control). */
	iconClass?: string
	/** Small dot in the top-right corner (e.g. unsaved changes). */
	badge?: boolean
}>()
</script>

<template>
	<UTooltip :text="tooltip" :content="{ side: 'bottom', align: 'start' }">
		<UButton color="neutral" variant="ghost" size="md" square class="relative" :disabled="disabled" :aria-label="tooltip">
			<Icon :name="icon" class="size-5 shrink-0 [&_svg]:block" :class="[spin ? 'animate-spin' : '', iconClass]" />
			<span v-if="badge" class="absolute top-1 right-1 size-2 rounded-full bg-primary" />
		</UButton>
	</UTooltip>
</template>
