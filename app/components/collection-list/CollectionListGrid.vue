<script setup lang="ts">
import type { CollectionListItem } from '~/types/collections'

const props = defineProps<{ items: CollectionListItem[]; keyPrefix: string }>()

const emit = defineEmits<{ edit: [item: CollectionListItem] }>()

function firstRow<T>(items: T[]): T[] {
	return items.slice(0, 3)
}

function restRows<T>(items: T[]): T[] {
	return items.slice(3)
}
</script>

<template>
	<template v-if="props.items.length">
		<div
			v-if="firstRow(props.items).length"
			class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[3fr_2fr_2fr] sm:grid-rows-[380px]"
		>
			<CollectionCard
				v-for="(c, index) in firstRow(props.items)"
				:key="`${props.keyPrefix}-${c.id}`"
				:collection="c"
				:size="index === 0 ? 'big' : 'medium'"
				@edit="emit('edit', c)"
			/>
		</div>
		<div v-if="restRows(props.items).length" class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
			<CollectionCard
				v-for="c in restRows(props.items)"
				:key="`${props.keyPrefix}-${c.id}`"
				:collection="c"
				size="smol"
				@edit="emit('edit', c)"
			/>
		</div>
	</template>
</template>
