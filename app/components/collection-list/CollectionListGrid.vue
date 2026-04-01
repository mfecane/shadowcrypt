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
			class="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-[3fr_2fr_2fr] sm:grid-rows-[380px] sm:gap-8"
		>
			<CollectionCard
				v-for="(c, index) in firstRow(props.items)"
				:key="`${props.keyPrefix}-${c.id}`"
				:collection="c"
				:big="index === 0"
				size="large"
				@edit="emit('edit', c)"
			/>
		</div>
		<div v-if="restRows(props.items).length" class="collection-main-grid">
			<CollectionCard
				v-for="c in restRows(props.items)"
				:key="`${props.keyPrefix}-${c.id}`"
				:collection="c"
				:big="false"
				size="compact"
				@edit="emit('edit', c)"
			/>
		</div>
	</template>
</template>

<style scoped>
.collection-main-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	grid-auto-rows: 220px;
	gap: 24px;
}
</style>
