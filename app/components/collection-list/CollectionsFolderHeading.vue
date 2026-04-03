<script setup lang="ts">
withDefaults(
	defineProps<{
		name: string
		link: string | null
		editable?: boolean
		icon?: string
	}>(),
	{ link: null, editable: false, icon: 'i-lucide-folder' }
)

const emit = defineEmits<{ edit: [] }>()
</script>

<template>
	<div class="mb-4 flex min-w-0 flex-wrap items-center gap-4">
		<NuxtLink
			v-if="link"
			:to="link"
			class="text-dimmed hover:text-beige-300 min-w-0 text-left transition-colors flex items-center gap-2"
		>
			<Icon :name="icon" class="h-4 w-4 text-dimmed" />
			<h2 class="truncate text-lg font-semibold uppercase tracking-wider">{{ name }}</h2>
		</NuxtLink>
		<h2
			v-else
			class="text-dimmed min-w-0 truncate text-lg font-semibold uppercase tracking-wider flex items-center gap-2"
		>
			<Icon :name="icon" class="h-4 w-4 text-dimmed" />{{ name }}
		</h2>
		<UButton
			v-if="editable"
			variant="ghost"
			color="neutral"
			size="sm"
			@click="emit('edit')"
			class="rounded-sm h-6 w-6 p-1 border border-muted text-muted hover:text-highlighted hover:border-highlighted"
		>
			<Icon name="i-lucide-pencil" class="h-4 w-4" />
		</UButton>
	</div>
</template>
