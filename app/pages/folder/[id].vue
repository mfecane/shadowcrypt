<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import ArchivedCollectionCard from '~/components/collection-list/ArchivedCollectionCard.vue'
import ArchivedFolderRow from '~/components/collection-list/ArchivedFolderRow.vue'
import CollectionListEmphasizedGrid from '~/components/collection-list/CollectionListEmphasizedGrid.vue'
import CollectionsFolderHeading from '~/components/collection-list/CollectionsFolderHeading.vue'
import type { CollectionListItem, FolderDetailResponse } from '~/types/collections'

definePageMeta({
	auth: {
		unauthenticatedOnly: false,
		navigateUnauthenticatedTo: '/auth/gate',
	},
})

const route = useRoute()
const id = computed(() => route.params.id as string)

const folderEdit = useFolderEditModalState()
const collectionEdit = useCollectionListEditModalState()

const {
	data,
	isPending: pending,
	error,
} = useQuery({
	queryKey: ['folder', id],
	queryFn: () => $fetch<FolderDetailResponse>(`/api/folders/${id.value}`),
})

const folder = computed(() => data.value?.folder ?? null)

useHead({
	title: computed(() => folder.value?.name ?? 'Folder'),
})

function openFolderEditFromPage(): void {
	const f = folder.value
	if (f === null) {
		return
	}
	folderEdit.value = { id: f.id, name: f.name, archived: f.archived }
}

function openCollectionEdit(c: CollectionListItem): void {
	collectionEdit.value = {
		id: c.id,
		name: c.name,
		pinned: c.pinned,
		archived: c.archived,
		folderId: c.folderId,
		folder: c.folder,
	}
}

/** Only show rows that belong to this folder (same id as the route). */
const collectionsInFolder = computed(() => {
	const d = data.value
	if (d === undefined) {
		return []
	}
	return d.collections.filter((c) => c.folderId === id.value)
})

const archivedInFolder = computed(() => {
	const d = data.value
	if (d === undefined) {
		return []
	}
	return d.archivedCollections.filter((c) => c.folderId === id.value)
})

const archivedFolderSummary = computed(() => {
	const f = folder.value
	if (f === null || !f.archived) {
		return null
	}
	return {
		id: f.id,
		name: f.name,
		lastSeenAt: f.lastSeenAt,
		updatedAt: f.updatedAt,
	}
})
</script>

<template>
	<div>
		<CollectionsListHeader />

		<div class="mx-auto max-w-6xl px-5 pt-4 pb-24">
			<UButton variant="ghost" color="neutral" class="items-center gap-2 mb-4 inline-flex" to="/list">
				<Icon name="i-lucide-arrow-left" class="h-4 w-4" /> <span class="text-sm">All collections</span>
			</UButton>

			<p v-if="pending" class="text-muted text-sm">Loading folder…</p>

			<p v-else-if="error || folder === null" class="text-beige-400 text-lg font-medium">
				Folder not found or you do not have access.
			</p>

			<template v-else-if="folder.archived && archivedFolderSummary !== null">
				<CollectionsFolderHeading
					:link="null"
					:name="folder.name"
					:editable="true"
					@edit="openFolderEditFromPage"
				/>
				<p class="text-muted mb-4 text-sm">This folder is archived. Unarchive to see collections here.</p>
				<ArchivedFolderRow :folder="archivedFolderSummary" />
			</template>

			<template v-else>
				<CollectionsFolderHeading
					:link="null"
					:name="folder.name"
					:editable="true"
					@edit="openFolderEditFromPage"
				/>

				<template
					v-if="data !== undefined && collectionsInFolder.length === 0 && archivedInFolder.length === 0"
				>
					<p class="text-muted text-sm">No collections in this folder.</p>
				</template>

				<template v-else-if="data !== undefined">
					<CollectionListEmphasizedGrid
						v-if="collectionsInFolder.length"
						:items="collectionsInFolder"
						:key-prefix="`folder-page-${folder.id}`"
						:show-folder="false"
						@edit="openCollectionEdit"
					/>
					<section v-if="archivedInFolder.length" class="border-muted mt-8 border-t border-dashed pt-6">
						<h3 class="text-muted mb-3 text-xs font-semibold uppercase tracking-wider">
							Archived in this folder
						</h3>
						<div class="grid grid-cols-3 gap-4">
							<ArchivedCollectionCard
								v-for="c in archivedInFolder"
								:key="`ap-arch-${c.id}`"
								:collection="c"
							/>
						</div>
					</section>
				</template>
			</template>
		</div>
	</div>
</template>
