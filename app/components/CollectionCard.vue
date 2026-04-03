<script setup lang="ts">
import type { CollectionListItem } from '~/types/collections'

const props = withDefaults(
	defineProps<{
		collection: CollectionListItem
		size: 'big' | 'medium' | 'smol'
		showEdit?: boolean
		folderName?: string
		folderId?: string
	}>(),
	{
		showEdit: true,
	}
)

const emit = defineEmits<{ edit: [] }>()

const colletionLink = computed(() => {
	return `/collections/${props.collection.id}`
})

const itemWrapperClass = computed(() => {
	switch (props.size) {
		case 'big':
		case 'medium':
			return 'h-full min-h-[420px]'
		case 'smol':
			return 'h-[320px]'
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
		class="border-muted bg-elevated flex min-h-0 flex-col overflow-hidden rounded-md border shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)] p-1 relative"
		:class="itemWrapperClass"
	>
		<UButton
			variant="ghost"
			size="sm"
			class="border-muted text-muted border absolute top-1 right-1 z-10 size-6 p-1 pt-1.5"
			@click="emit('edit')"
		>
			<Icon name="i-lucide-pencil" class="h-4 w-4" />
		</UButton>
		<NuxtLink :to="colletionLink" class="flex h-full min-h-0 flex-col gap-1">
			<div class="flex flex-col shrink-0 items-start justify-between gap-0.5 px-0.5">
				<div class="truncate text-base font-medium text-highlighted">{{ collection.name }}</div>
				<div class="text-beige-500 text-xs font-medium">{{ collection.imageCount }} items</div>
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
		<UButton
			v-if="folderName && folderId"
			:to="`/folder/${folderId}`"
			variant="soft"
			size="sm"
			color="neutral"
			class="self-start mt-1 bg-neutral-900 hover:bg-neutral-800 text-muted hover:text-highlighted p-1 px-2"
		>
			<Icon name="i-lucide-folder" class="h-3 w-3" />
			<span class="text-xs font-medium">{{ folderName }}</span>
		</UButton>
	</div>
</template>
