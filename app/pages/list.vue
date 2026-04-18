<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import CollectionListArchived from '~/components/collection-list/CollectionListArchived.vue'
import CollectionListFilters from '~/components/collection-list/CollectionListFilters.vue'
import CollectionListFolders from '~/components/collection-list/CollectionListFolders.vue'
import CollectionListRecent from '~/components/collection-list/CollectionListRecent.vue'
import type {
	CollectionFolderBlock,
	CollectionListFilter,
	CollectionListItem,
	CollectionsListResponse,
} from '~/types/collections'

useHead({
	title: 'Collection list',
})

const folderEdit = useFolderEditModalState()
const collectionEdit = useCollectionListEditModalState()

const route = useRoute()
const router = useRouter()

function parseTab(q: unknown): CollectionListFilter {
	const v = Array.isArray(q) ? q[0] : q
	if (v === 'recent' || v === 'folders' || v === 'archived') {
		return v
	}
	return 'recent'
}

const filter = ref<CollectionListFilter>(parseTab(route.query.tab))

watch(
	() => route.query.tab,
	(t) => {
		filter.value = parseTab(t)
	}
)

watch(filter, (f) => {
	if (parseTab(route.query.tab) !== f) {
		router.replace({ path: '/list', query: { tab: f } })
	}
})

watch(
	() => [filter.value, route.hash] as const,
	async () => {
		if (filter.value !== 'folders' || route.hash !== '#no-folder') {
			return
		}
		await nextTick()
		document.getElementById('no-folder')?.scrollIntoView({ behavior: 'smooth' })
	}
)

const { data, isPending: pending } = useQuery({
	queryKey: ['collections'],
	queryFn: () => $fetch<CollectionsListResponse>('/api/collections'),
})

const pinnedCollections = computed(() => data.value?.pinned ?? [])

const folderBlocks = computed(() => data.value?.folders ?? [])

const ungroupedCollections = computed(() => data.value?.ungrouped ?? [])

const archivedFolders = computed(() => data.value?.archivedFolders ?? [])

const archivedUngrouped = computed(() => data.value?.archivedUngrouped ?? [])

/** Pinned + folder collections + ungrouped, excluding pinned from the main grid; sorted by recency. */
const recentMainItems = computed(() => {
	const pinnedIds = new Set(pinnedCollections.value.map((c) => c.id))
	const fromFolders = folderBlocks.value.flatMap((b) => b.collections)
	const merged = [...fromFolders, ...ungroupedCollections.value]
	const seen = new Set<string>()
	const out: CollectionListItem[] = []
	for (const c of merged) {
		if (pinnedIds.has(c.id)) {
			continue
		}
		if (seen.has(c.id)) {
			continue
		}
		seen.add(c.id)
		out.push(c)
	}
	out.sort((a, b) => {
		const ta = a.lastSeenAt ?? a.updatedAt
		const tb = b.lastSeenAt ?? b.updatedAt
		return tb.localeCompare(ta)
	})
	return out
})

function openFolderEdit(block: CollectionFolderBlock): void {
	folderEdit.value = { id: block.id, name: block.name, archived: false }
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
					<CollectionListFilters v-model="filter" />

					<CollectionListRecent
						v-if="filter === 'recent'"
						:pinned="pinnedCollections"
						:items="recentMainItems"
						@edit="openCollectionEdit"
					/>

					<CollectionListFolders
						v-if="filter === 'folders'"
						:blocks="folderBlocks"
						:ungrouped="ungroupedCollections"
						@edit-collection="openCollectionEdit"
						@edit-folder="openFolderEdit"
					/>

					<CollectionListArchived
						v-if="filter === 'archived'"
						:archived-folders="archivedFolders"
						:folder-blocks="folderBlocks"
						:archived-ungrouped="archivedUngrouped"
					/>
				</template>
			</template>
		</div>
	</div>
</template>
