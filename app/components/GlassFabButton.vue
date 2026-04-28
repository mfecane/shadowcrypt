<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
	defineProps<{
		icon?: string
		tooltip: string
	}>(),
	{
		icon: 'i-lucide-plus',
	}
)

const attrs = useAttrs()
</script>

<template>
	<UTooltip :text="tooltip" :content="{ side: 'bottom', align: 'start' }">
		<UButton
			v-bind="attrs"
			color="primary"
			variant="ghost"
			square
			:leading-icon="icon"
			:aria-label="tooltip"
			:class="[
				'relative z-30 rounded-full shadow-lg text-primary bg-primary-950/60 backdrop-blur-sm border border-primary-700 flex',
				'items-center justify-center size-14 hover:bg-neutral-950/60 transition-colors duration-400 ',
				'hover:text-primary-200 hover:border-primary-500',
			]"
		/>
	</UTooltip>
</template>
