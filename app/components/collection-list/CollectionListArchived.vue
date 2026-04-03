<script setup lang="ts">
import ArchivedCollectionCard from '~/components/collection-list/ArchivedCollectionCard.vue'
import ArchivedFolderRow from '~/components/collection-list/ArchivedFolderRow.vue'
import type { ArchivedFolderSummary, CollectionFolderBlock, CollectionListItem } from '~/types/collections'

const props = defineProps<{
	archivedFolders: ArchivedFolderSummary[]
	folderBlocks: CollectionFolderBlock[]
	archivedUngrouped: CollectionListItem[]
}>()

const isEmpty = computed(
	() =>
		props.archivedFolders.length === 0 &&
		props.archivedUngrouped.length === 0 &&
		!props.folderBlocks.some((b) => b.archivedCollections.length > 0)
)
</script>

<template>
	<div>
		<p v-if="isEmpty" class="text-muted text-sm">Nothing archived.</p>
		<template v-else>
			<section v-if="archivedFolders.length" class="mb-12">
				<h2 class="text-muted mb-4 text-sm font-semibold uppercase tracking-wider">Archived folders</h2>
				<div class="space-y-2">
					<ArchivedFolderRow v-for="f in archivedFolders" :key="`af-${f.id}`" :folder="f" />
				</div>
			</section>

			<template v-for="block in folderBlocks" :key="`afc-${block.id}`">
				<section v-if="block.archivedCollections.length" class="mb-12">
					<h2 class="text-muted mb-4 text-sm font-semibold uppercase tracking-wider">{{ block.name }}</h2>
					<div class="grid grid-cols-3 gap-4">
						<ArchivedCollectionCard
							v-for="c in block.archivedCollections"
							:key="`arch-${block.id}-${c.id}`"
							:collection="c"
						/>
					</div>
				</section>
			</template>

			<section v-if="archivedUngrouped.length" class="grid grid-cols-3 gap-4">
				<ArchivedCollectionCard v-for="c in archivedUngrouped" :key="`au-${c.id}`" :collection="c" />
			</section>
		</template>
	</div>
</template>
