<script setup lang="ts">
import type { CollectionListItem } from '~/types/collections'

const props = withDefaults(
	defineProps<{ collection: CollectionListItem; size: 'big' | 'medium' | 'smol'; showEdit?: boolean }>(),
	{
		showEdit: true,
	}
)

const emit = defineEmits<{ edit: [] }>()

const itemWrapperClass = computed(() => {
	switch (props.size) {
		case 'big':
		case 'medium':
			return 'h-full min-h-[380px]'
		case 'smol':
			return 'h-[220px]'
		default:
			throw new Error(`Unreachable code`)
	}
})

const itemGridClass = computed(() => {
	switch (props.size) {
		case 'big':
			return 'grid-cols-[repeat(2,2fr)_3fr] grid-rows-[3fr_1fr_2fr]'
		case 'medium':
			return 'grid-cols-[3fr_2fr] grid-rows-2'
		case 'smol':
			return ['grid-cols-2', 'grid-rows-2']
		default:
			throw new Error(`Unreachable code`)
	}
})

const imageClassByIndex = (index: number) => {
	if (props.size === 'big' && index === 0) {
		return ['col-span-2', 'row-span-2']
	}
	if (props.size === 'big' && index === 2) {
		return ['row-span-2']
	}
	// if (props.size === 'big' && index === 4) {
	// 	return ['row-span-2']
	// }
	if ((props.size === 'medium' || props.size === 'smol') && index === 0) {
		return ['row-span-2']
	}
	return []
}

const displayImages = computed(() => {
	if (props.size === 'big') {
		return props.collection.images.slice(0, 5)
	}
	return props.collection.images.slice(0, 3)
})
</script>

<template>
	<div
		class="border-muted bg-elevated relative flex min-h-0 flex-col overflow-hidden rounded-md border shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)] group"
		:class="itemWrapperClass"
	>
		<UButton
			variant="ghost"
			size="sm"
			class="border-muted border absolute top-1.5 right-1.5 z-10 size-6 p-1 group-hover:opacity-100 opacity-0"
			@click="emit('edit')"
		>
			<Icon name="i-lucide-pencil" class="h-4 w-4" />
		</UButton>
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
			<div
				v-if="displayImages.length"
				class="w-full flex items-stretch justify-center bg-muted/80 relative min-h-0 flex-1 p-0.5"
			>
				<div class="w-full h-full min-h-0 grid gap-0.5" :class="itemGridClass">
					<div
						v-for="(img, index) in displayImages"
						:key="img.id"
						class="min-h-0 overflow-hidden"
						:class="imageClassByIndex(index)"
					>
						<img :src="img.url" class="w-full h-full object-cover" alt="" @dragstart.prevent />
					</div>
				</div>
			</div>
			<div v-else class="w-full h-full flex items-center justify-center">No images</div>
		</NuxtLink>
	</div>
</template>
