<script setup lang="ts">
import CollectionsFolderHeading from '~/components/collection-list/CollectionsFolderHeading.vue'
import type { CollectionFolderBlock, CollectionListItem } from '~/types/collections'

const props = defineProps<{
	blocks: CollectionFolderBlock[]
	ungrouped: CollectionListItem[]
}>()

const emit = defineEmits<{
	editCollection: [item: CollectionListItem]
	editFolder: [block: CollectionFolderBlock]
}>()

const isEmpty = computed(() => props.blocks.length === 0 && props.ungrouped.length === 0)
</script>

<template>
	<div class="mb-12 space-y-12">
		<p v-if="isEmpty" class="text-muted text-sm">No folders yet.</p>
		<template v-else>
			<section v-for="block in blocks" :key="block.id">
				<CollectionsFolderHeading
					:link="`/folder/${block.id}`"
					:name="block.name"
					:editable="true"
					@edit="emit('editFolder', block)"
				/>
				<CollectionListPlainGrid
					v-if="block.collections.length"
					:items="block.collections"
					:key-prefix="`folder-${block.id}`"
					:show-folder="false"
					@edit="emit('editCollection', $event)"
				/>
				<p v-else class="text-muted text-sm">No collections in this folder.</p>
			</section>

			<section v-if="ungrouped.length" id="no-folder">
				<CollectionsFolderHeading name="No folder" link="/list?tab=folders#no-folder" />
				<CollectionListPlainGrid
					:items="ungrouped"
					key-prefix="ungrouped-folders-tab"
					:show-folder="false"
					@edit="emit('editCollection', $event)"
				/>
			</section>
		</template>
	</div>
</template>
