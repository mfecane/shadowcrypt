<script setup lang="ts">
defineProps<{
	icon: string
	disabled?: boolean
	tooltip?: string
	spin?: boolean
	/** Extra classes on the icon (e.g. success/error tone on the save control). */
	iconClass?: string
}>()
</script>

<template>
	<UTooltip :text="tooltip" :content="{ side: 'bottom', align: 'start' }">
		<UButton
			variant="ghost"
			class="rounded-md h-8 w-8 p-2 disabled:text-beige-600"
			:disabled="disabled"
			:aria-label="tooltip"
		>
			<Icon
				:name="icon"
				class="size-4 shrink-0 [&_svg]:block"
				:class="[spin ? 'animate-spin' : '', iconClass]"
			/>
		</UButton>
	</UTooltip>
</template>
