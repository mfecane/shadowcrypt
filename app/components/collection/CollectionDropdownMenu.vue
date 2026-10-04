<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui';

const emit = defineEmits<{
	'open-edit': []
}>()

const items = ref<DropdownMenuItem[][]>([
	[
		{
			label: 'Edit board',
			icon: 'i-lucide-pencil',
			onSelect: () => emit('open-edit')
		},
		{
			label: 'Edit collection',
			icon: 'i-lucide-pencil',
			onSelect: () => emit('open-edit')
		}
	]]
)
</script>

<template>
	<UDropdownMenu :items="items" :content="{ align: 'end' }">
		<CollectionToolbarButton :icon="'i-lucide-ellipsis-vertical'" />
	</UDropdownMenu>
</template>