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

function firstRow(items: CollectionListItem[]): CollectionListItem[] {
	return items.slice(0, 3)
}

function restRows(items: CollectionListItem[]): CollectionListItem[] {
	return items.slice(3)
}
</script>

<template>
	<template v-if="props.items.length">
		<div
			v-if="firstRow(props.items).length"
			class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-[4fr_3fr_3fr] sm:grid-rows-[420px]"
		>
			<CollectionCard
				v-for="(c, index) in firstRow(props.items)"
				:key="`${props.keyPrefix}-${c.id}`"
				:collection="c"
				:size="index === 0 ? 'big' : 'medium'"
				@edit="emit('edit', c)"
				:folder-name="props.showFolder ? c.folder?.name : undefined"
				:folder-id="props.showFolder ? c.folder?.id : undefined"
			/>
		</div>
		<div
			v-if="restRows(props.items).length"
			class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 gap-y-6"
		>
			<CollectionCard
				v-for="c in restRows(props.items)"
				:key="`${props.keyPrefix}-${c.id}`"
				:collection="c"
				size="smol"
				@edit="emit('edit', c)"
				:folder-name="props.showFolder ? c.folder?.name : undefined"
				:folder-id="props.showFolder ? c.folder?.id : undefined"
			/>
		</div>
	</template>
</template>
