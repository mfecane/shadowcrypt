<script lang="ts" setup>

defineEmits<{ 'open-image-upload-modal': [] }>()

const { bridge, autoLayoutPending, canUndo, canRedo } =
	storeToRefs(useCollectionViewerStore())
</script>

<template>
	<!-- Only for mobile screens -->
	<div class="block z-20 sm:hidden absolute bottom-0 left-0 right-0 h-16 bg-default p-2">
		<div class="mx-auto h-full flex gap-3 items-center w-fit">
			<CollectionToolbarButton @click="$emit('open-image-upload-modal')" icon="i-lucide-plus"
				tooltip="Add to collection" />

			<SaveWidget />

			<CollectionToolbarButton :icon="'i-lucide-undo'" tooltip="Undo" :disabled="!canUndo"
				@click="bridge?.undo()" />

			<CollectionToolbarButton :icon="'i-lucide-redo'" tooltip="Redo" :disabled="!canRedo"
				@click="bridge?.redo()" />

			<CollectionToolbarButton :icon="autoLayoutPending ? 'i-lucide-loader-2' : 'i-lucide-layout-template'"
				tooltip="Auto layout" :spin="autoLayoutPending" :disabled="bridge === null"
				@click="bridge?.autoLayout()" />

			<CollectionToolbarButton :icon="'i-lucide-scan-search'" tooltip="Fit into view" :disabled="bridge === null"
				@click="bridge?.fitIntoView()" />

			<UserAvatarMenu />
		</div>
	</div>
</template>