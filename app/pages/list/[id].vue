<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import ArchivedCollectionRow from '~/components/collection-list/ArchivedCollectionRow.vue'
import ArchivedFolderRow from '~/components/collection-list/ArchivedFolderRow.vue'
import CollectionListGrid from '~/components/collection-list/CollectionListGrid.vue'
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

const folderEdit = useFolderEditOverlayState()
const collectionEdit = useCollectionEditOverlayState()

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
	collectionEdit.value = { id: c.id, pinned: c.pinned, archived: c.archived }
}

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
			<div class="mb-6">
				<NuxtLink to="/list" class="text-muted hover:text-highlighted text-sm transition-colors">
					← All collections
				</NuxtLink>
			</div>

			<p v-if="pending" class="text-muted text-sm">Loading folder…</p>

			<p v-else-if="error || folder === null" class="text-beige-400 text-lg font-medium">
				Folder not found or you do not have access.
			</p>

			<template v-else-if="folder.archived && archivedFolderSummary !== null">
				<CollectionsFolderHeading
					:folder-id="folder.id"
					:name="folder.name"
					:linkable="false"
					@edit="openFolderEditFromPage"
				/>
				<p class="text-muted mb-4 text-sm">This folder is archived. Unarchive to see collections here.</p>
				<ArchivedFolderRow :folder="archivedFolderSummary" />
			</template>

			<template v-else>
				<CollectionsFolderHeading
					:folder-id="folder.id"
					:name="folder.name"
					:linkable="false"
					@edit="openFolderEditFromPage"
				/>

				<template
					v-if="data !== undefined && data.collections.length === 0 && data.archivedCollections.length === 0"
				>
					<p class="text-muted text-sm">No collections in this folder.</p>
				</template>

				<template v-else-if="data !== undefined">
					<CollectionListGrid
						v-if="data.collections.length"
						:items="data.collections"
						:key-prefix="`folder-page-${folder.id}`"
						@edit="openCollectionEdit"
					/>
					<section
						v-if="data.archivedCollections.length"
						class="border-muted mt-8 border-t border-dashed pt-6"
					>
						<h3 class="text-muted mb-3 text-xs font-semibold uppercase tracking-wider">
							Archived in this folder
						</h3>
						<div class="space-y-2">
							<ArchivedCollectionRow
								v-for="c in data.archivedCollections"
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
