<script setup lang="ts">
import type { CollectionListItem } from '~/types/collections'

withDefaults(
	defineProps<{ collection: CollectionListItem; big?: boolean; size: 'large' | 'compact'; showEdit?: boolean }>(),
	{ big: false, showEdit: true }
)

const emit = defineEmits<{ edit: [] }>()
</script>

<template>
	<div
		class="border-muted bg-elevated relative flex min-h-0 flex-col overflow-hidden rounded-lg border shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)]"
		:class="size === 'large' ? 'h-full min-h-[380px]' : 'h-[220px]'"
	>
		<button
			v-if="showEdit"
			type="button"
			class="text-muted hover:text-highlighted absolute top-1.5 right-1.5 z-10 rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors"
			@click.stop="emit('edit')"
		>
			Edit
		</button>
		<NuxtLink
			:to="`/collections/${collection.id}`"
			class="text-beige-400 hover:text-beige-300 flex h-full min-h-0 flex-col p-1.5"
		>
			<div class="mb-1 flex shrink-0 items-start justify-between gap-2 px-0.5">
				<div class="min-w-0 flex-1 pr-10">
					<div class="truncate pl-0.5 text-base font-medium text-highlighted">{{ collection.name }}</div>
					<div class="text-beige-500 pl-0.5 text-xs font-medium">{{ collection.imageCount }} items</div>
				</div>
			</div>
			<div class="item__wrapper bg-muted/80 relative min-h-0 flex-1 rounded-sm p-1.5">
				<div
					v-if="collection.images.length"
					class="item__grid h-full min-h-0"
					:class="big ? 'big' : 'small'"
				>
					<div v-for="img in collection.images" :key="img.id" class="min-h-0 overflow-hidden">
						<img :src="img.url" class="item__image" alt="" @dragstart.prevent>
					</div>
				</div>
				<div v-else class="empty">Nothing</div>
			</div>
		</NuxtLink>
	</div>
</template>

<style scoped>
.item__wrapper:has(.empty) {
	display: flex;
	align-items: center;
	justify-content: center;
}

.item__grid {
	height: 100%;
	display: grid;
	gap: 1px;
	transition: 200ms ease-out all;
}

.item__grid.big {
	grid-template-columns: repeat(2, 2fr) 3fr;
	grid-template-rows: 3fr 1fr 2fr;
}

.item__grid.big > *:first-child {
	grid-column: span 2;
	grid-row: span 2;
}

.item__grid.big > *:nth-child(3) {
	grid-row: span 2;
}

.item__grid.big > *:nth-child(n + 6) {
	display: none;
}

.item__grid.small {
	grid-template-columns: 3fr 2fr;
	grid-template-rows: 1fr 1fr;
}

.item__grid.small > *:first-child {
	grid-row: span 2;
}

.item__grid.small > *:nth-child(n + 4) {
	display: none;
}

.item__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 120px;
	color: var(--ui-color-neutral-400);
}
</style>
