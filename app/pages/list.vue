<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import ArchivedCollectionCard from '~/components/collection-list/ArchivedCollectionCard.vue'
import ArchivedFolderRow from '~/components/collection-list/ArchivedFolderRow.vue'
import CollectionListGrid from '~/components/collection-list/CollectionListGrid.vue'
import CollectionsFolderHeading from '~/components/collection-list/CollectionsFolderHeading.vue'
import type { CollectionFolderBlock, CollectionListItem, CollectionsListResponse } from '~/types/collections'

useHead({
	title: 'Collection list',
})

const folderEdit = useFolderEditOverlayState()
const collectionEdit = useCollectionEditOverlayState()

const { data, isPending: pending } = useQuery({
	queryKey: ['collections'],
	queryFn: () => $fetch<CollectionsListResponse>('/api/collections'),
})

const pinnedCollections = computed(() => data.value?.pinned ?? [])

const folderBlocks = computed(() => data.value?.folders ?? [])

const ungroupedCollections = computed(() => data.value?.ungrouped ?? [])

const archivedFolders = computed(() => data.value?.archivedFolders ?? [])

const archivedUngrouped = computed(() => data.value?.archivedUngrouped ?? [])

function openFolderEdit(block: CollectionFolderBlock): void {
	folderEdit.value = { id: block.id, name: block.name, archived: false }
}

function openCollectionEdit(c: CollectionListItem): void {
	collectionEdit.value = { id: c.id, name: c.name, pinned: c.pinned, archived: c.archived }
}

const collectionExist = computed(() => {
	const d = data.value
	if (d === undefined) {
		return false
	}
	if (d.pinned.length > 0 || d.ungrouped.length > 0) {
		return true
	}
	if (d.archivedFolders.length > 0 || d.archivedUngrouped.length > 0) {
		return true
	}
	if (d.folders.length > 0) {
		return true
	}
	return false
})
</script>

<template>
	<div>
		<CollectionsListHeader />

		<div class="mx-auto max-w-6xl px-5 pt-4 pb-24">
			<p v-if="pending" class="text-muted text-sm">Loading collections…</p>

			<template v-else>
				<template v-if="!collectionExist">
					<p class="text-beige-400 text-lg font-medium">No collections</p>
				</template>

				<template v-else>
					<section v-if="pinnedCollections.length" class="mb-12">
						<CollectionsFolderHeading name="Pinned" :link="null" icon="i-lucide-pin" />
						<CollectionListGrid :items="pinnedCollections" key-prefix="pinned" @edit="openCollectionEdit" />
					</section>

					<template v-for="block in folderBlocks" :key="block.id">
						<section class="mb-12">
							<CollectionsFolderHeading
								:link="`/folder/${block.id}`"
								:name="block.name"
								@edit="openFolderEdit(block)"
								:editable="true"
							/>
							<CollectionListGrid
								v-if="block.collections.length"
								:items="block.collections"
								:key-prefix="`folder-${block.id}`"
								@edit="openCollectionEdit"
							/>
							<p v-else-if="block.archivedCollections.length === 0" class="text-muted text-sm">
								No collections in this folder.
							</p>
							<section v-if="block.archivedCollections.length" class="grid grid-cols-3 gap-4">
								<ArchivedCollectionCard
									v-for="c in block.archivedCollections"
									:key="`arch-${block.id}-${c.id}`"
									:collection="c"
								/>
							</section>
						</section>
					</template>

					<section v-if="ungroupedCollections.length" class="mb-12">
						<h2 class="text-muted mb-4 text-sm font-semibold uppercase tracking-wider">Without folder</h2>
						<CollectionListGrid
							:items="ungroupedCollections"
							key-prefix="ungrouped"
							@edit="openCollectionEdit"
						/>
					</section>

					<section v-if="archivedFolders.length" class="mb-12">
						<h2 class="text-muted mb-4 text-sm font-semibold uppercase tracking-wider">Archived folders</h2>
						<div class="space-y-2">
							<ArchivedFolderRow v-for="f in archivedFolders" :key="`af-${f.id}`" :folder="f" />
						</div>
					</section>

					<section v-if="archivedUngrouped.length" class="grid grid-cols-3 gap-4">
						<ArchivedCollectionCard v-for="c in archivedUngrouped" :key="`au-${c.id}`" :collection="c" />
					</section>
				</template>
			</template>
		</div>
	</div>
</template>
