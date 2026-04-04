<script setup lang="ts">
import type { CollectionListItem } from '~/types/collections'

const props = withDefaults(
	defineProps<{
		items: CollectionListItem[]
		keyPrefix: string
		showFolder?: boolean
	}>(),
	{ showFolder: false }
)

const emit = defineEmits<{ edit: [item: CollectionListItem] }>()
</script>

<template>
	<div
		v-if="props.items.length"
		class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
	>
		<CollectionCard
			v-for="c in props.items"
			:key="`${props.keyPrefix}-${c.id}`"
			:collection="c"
			size="smol"
			:folder-name="props.showFolder ? c.folder?.name : undefined"
			:folder-id="props.showFolder ? c.folder?.id : undefined"
			@edit="emit('edit', c)"
		/>
	</div>
</template>
