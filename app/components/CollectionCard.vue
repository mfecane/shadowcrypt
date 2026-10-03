<script setup lang="ts">
import type { CollectionListItem } from '~/types/collections';

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
		folderName: undefined,
		folderId: undefined,
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

</script>

<template>
	<div class="border-muted bg-elevated flex min-h-0 flex-col overflow-hidden rounded-md border shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)] p-1 relative"
		:class="itemWrapperClass">
		<UButton v-if="showEdit" variant="ghost" color="neutral" size="xs" square class="absolute top-1.5 right-1.5 z-1"
			@click="emit('edit')">
			<Icon name="i-lucide-ellipsis-vertical" class="h-4 w-4" />
		</UButton>
		<NuxtLink :to="colletionLink" class="flex h-full min-h-0 flex-col gap-1">
			<div class="flex flex-col shrink-0 items-start justify-between gap-0.5 px-0.5">
				<div class="truncate text-base font-medium text-highlighted">{{ collection.name }}</div>
				<div class="text-primary text-xs font-medium">{{ collection.imageCount }} items</div>
			</div>
			<ImageMosaicGrid :images="collection.images" :size="size" />
		</NuxtLink>
		<UButton v-if="folderName && folderId" :to="`/folder/${folderId}`" variant="soft" size="sm" color="neutral"
			class="mt-2 self-start">
			<Icon name="i-lucide-folder" class="h-3 w-3" />
			<span>{{ folderName }}</span>
		</UButton>
	</div>
</template>