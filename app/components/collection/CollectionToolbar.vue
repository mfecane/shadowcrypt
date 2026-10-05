<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import CollectionDeleteImageModal from '~/components/collection/CollectionDeleteImageModal.vue'
import CollectionImageEditModal from '~/components/collection/CollectionImageEditModal.vue'
import CollectionMoveImageModal from '~/components/collection/CollectionMoveImageModal.vue'
import CollectionToolbarButton from '~/components/collection/CollectionToolbarButton.vue'
import SaveWidget from '~/components/collection/SaveWidget.vue'
import { collectionsQueryKey, useCollectionsListQuery } from '~/composables/useCollectionsListQuery'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'
import type { BoardDetail } from '~/types/boards'
import type { CollectionListItem, CollectionsListResponse } from '~/types/collections'
import { nn } from '~~/lib/collectionViewer/viewerUtils'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

function flattenCollectionsDeduped(res: CollectionsListResponse): CollectionListItem[] {
	const seen = new Set<string>()
	const out: CollectionListItem[] = []
	const push = (c: CollectionListItem): void => {
		if (seen.has(c.id)) {
			return
		}
		seen.add(c.id)
		out.push(c)
	}
	for (const f of res.folders) {
		for (const c of f.collections) {
			push(c)
		}
	}
	for (const c of res.ungrouped) {
		push(c)
	}
	return out
}

function groupedCollectionOptions(
	res: CollectionsListResponse
): { label: string; options: { id: string; name: string }[] }[] {
	const seen = new Set<string>()
	const take = (c: CollectionListItem): { id: string; name: string } | null => {
		if (seen.has(c.id)) {
			return null
		}
		seen.add(c.id)
		return { id: c.id, name: c.name }
	}
	const groups: { label: string; options: { id: string; name: string }[] }[] = []
	for (const f of res.folders) {
		if (f.collections.length === 0) {
			continue
		}
		const options = f.collections.map(take).filter((o): o is { id: string; name: string } => o !== null)
		if (options.length > 0) {
			groups.push({ label: f.name, options })
		}
	}
	if (res.ungrouped.length > 0) {
		const options = res.ungrouped.map(take).filter((o): o is { id: string; name: string } => o !== null)
		if (options.length > 0) {
			groups.push({ label: 'Without folder', options })
		}
	}
	return groups
}

function groupsExcludingCollectionId(
	groups: { label: string; options: { id: string; name: string }[] }[],
	excludeId: string
): { label: string; options: { id: string; name: string }[] }[] {
	return groups
		.map((g) => ({
			...g,
			options: g.options.filter((o) => o.id !== excludeId),
		}))
		.filter((g) => g.options.length > 0)
}

const { boardId, boardName, collectionId, selectedImageId, canUndo, canRedo, bridge, autoLayoutPending } =
	storeToRefs(useCollectionViewerStore())

const selected = computed(() => selectedImageId.value)

const router = useRouter()
const queryClient = useQueryClient()

const editOpen = ref(false)
const deleteOpen = ref(false)
const editName = ref('')
const editError = ref<string | null>(null)
const deleteError = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

const moveOpen = ref(false)
const moveTargetCollectionId = ref<string | null>(null)
const moveError = ref<string | null>(null)
const moving = ref(false)

const imageEditOpen = ref(false)
const imageEditSourceUrl = ref('')
const imageEditError = ref<string | null>(null)
const imageEditSaving = ref(false)

const collectionEdit = useCollectionListEditModalState()

const { data: collectionsData, isPending: collectionsListPending } = useCollectionsListQuery()

const moveCollectionGroups = computed(() => {
	if (collectionsData.value === undefined) {
		return []
	}
	const cid = collectionId.value
	if (cid === null) {
		return []
	}
	const g = groupedCollectionOptions(collectionsData.value)
	return groupsExcludingCollectionId(g, cid)
})

const collectionName = computed(() => {
	if (collectionsData.value === undefined) {
		return null
	}
	const cid = collectionId.value
	if (cid === null) {
		return null
	}
	return flattenCollectionsDeduped(collectionsData.value).find((c) => c.id === cid)?.name ?? null
})

const hasAnotherCollection = computed(() => {
	if (collectionsData.value === undefined) {
		return false
	}
	const cid = collectionId.value
	if (cid === null) {
		return false
	}
	return flattenCollectionsDeduped(collectionsData.value).some((c) => c.id !== cid)
})

function openEditBoard(): void {
	editName.value = boardName.value
	editError.value = null
	editOpen.value = true
}

function openEditCollection(): void {
	const cid = collectionId.value
	if (cid === null || collectionsData.value === undefined) {
		return
	}
	const c = flattenCollectionsDeduped(collectionsData.value).find((item) => item.id === cid)
	if (c === undefined) {
		return
	}
	collectionEdit.value = {
		id: c.id,
		name: c.name,
		pinned: c.pinned,
		archived: c.archived,
		folderId: c.folderId,
		folder: c.folder,
	}
}

async function saveEdit(): Promise<void> {
	const name = editName.value.trim()
	if (name === '') {
		return
	}
	saving.value = true
	editError.value = null
	try {
		await $fetch(`/api/boards/${boardId.value}`, {
			method: 'PATCH',
			body: { name },
		})
		bridge.value?.setBoardName(name)
		await queryClient.invalidateQueries({ queryKey: collectionsQueryKey })
		await queryClient.invalidateQueries({ queryKey: ['collection', collectionId.value] })
		editOpen.value = false
	} catch (e: unknown) {
		editError.value = fetchFormErrorMessage(e, 'Save failed')
	} finally {
		saving.value = false
	}
}

function openDeleteImage(): void {
	if (selected.value === null) {
		return
	}
	deleteError.value = null
	deleteOpen.value = true
}

function openMoveImage(): void {
	if (selected.value === null) {
		return
	}
	moveError.value = null
	moveTargetCollectionId.value = null
	moveOpen.value = true
}

async function confirmMoveImage(): Promise<void> {
	const imageId = nn(selected.value)
	const targetId = moveTargetCollectionId.value
	if (targetId === null || targetId === collectionId.value) {
		return
	}
	moving.value = true
	moveError.value = null
	try {
		await $fetch(`/api/boards/${boardId.value}/images/${imageId}/move`, {
			method: 'POST',
			body: { targetCollectionId: targetId },
		})
		bridge.value?.removeImage(imageId)
		await queryClient.invalidateQueries({ queryKey: ['board', boardId.value] })
		await queryClient.invalidateQueries({ queryKey: ['collection', collectionId.value] })
		await queryClient.invalidateQueries({ queryKey: ['collection', targetId] })
		await queryClient.invalidateQueries({ queryKey: collectionsQueryKey })
	} catch (e: unknown) {
		moveError.value = fetchFormErrorMessage(e, 'Move failed')
		moveOpen.value = true
	} finally {
		moving.value = false
	}
}

function openImageEdit(): void {
	const imageId = selected.value
	if (imageId === null) {
		return
	}
	const board = queryClient.getQueryData<{ board: BoardDetail }>(['board', boardId.value])?.board
	imageEditSourceUrl.value = board?.images.find((i) => i.id === imageId)?.sourceUrl ?? ''
	imageEditError.value = null
	imageEditOpen.value = true
}

async function saveImageEdit(): Promise<void> {
	const imageId = selected.value
	if (imageId === null) {
		return
	}
	imageEditSaving.value = true
	imageEditError.value = null
	try {
		const trimmed = imageEditSourceUrl.value.trim()
		await $fetch(`/api/boards/${boardId.value}/images/${imageId}/source-url`, {
			method: 'PATCH',
			body: { sourceUrl: trimmed === '' ? null : trimmed },
		})
		queryClient.setQueryData<{ board: BoardDetail } | undefined>(['board', boardId.value], (prev) => {
			if (prev === undefined) {
				return prev
			}
			return {
				board: {
					...prev.board,
					images: prev.board.images.map((i) =>
						i.id === imageId ? { ...i, sourceUrl: trimmed === '' ? null : trimmed } : i
					),
				},
			}
		})
		imageEditOpen.value = false
	} catch (e: unknown) {
		imageEditError.value = fetchFormErrorMessage(e, 'Save failed')
	} finally {
		imageEditSaving.value = false
	}
}

async function confirmDeleteImage(): Promise<void> {
	const imageId = nn(selected.value)
	deleting.value = true
	deleteError.value = null
	try {
		await $fetch(`/api/boards/${boardId.value}/images/${imageId}`, {
			method: 'DELETE',
		})
		bridge.value?.removeImage(imageId)
		await queryClient.invalidateQueries({ queryKey: ['board', boardId.value] })
		await queryClient.invalidateQueries({ queryKey: collectionsQueryKey })
		deleteOpen.value = false
		// Board owns selection; no-op here.
	} catch (e: unknown) {
		deleteError.value = fetchFormErrorMessage(e, 'Delete failed')
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<div :class="['absolute left-2 top-2 z-20 max-w-[calc(100vw-6rem)] flex flex-wrap transition-all duration-300 ease-in-out gap-2']"
		data-id="collection-toolbar">
		<div
			:class="['flex gap-2 items-center bg-default/70 backdrop-blur-sm  rounded-lg p-1.5', 'border border-default/40']">

			<CollectionToolbarButton :icon="'i-lucide-chevron-left'" tooltip="Back" @click="router.push('/list')" />

			<USeparator orientation="vertical" />

			<div class="flex gap-2 items-center mx-2">
				<UIcon name="i-lucide-layout-dashboard" class="size-6 shrink-0" />
				<div class="flex flex-col shrink-0 gap-1" data-id="collection-toolbar-titles">
					<h2 class="text-toned text-sm leading-none">{{ collectionName ?? 'Collection' }}</h2>
					<span class="text-dimmed text-xs leading-none">{{ boardName }}</span>
				</div>

				<CollectionDropdownMenu @open-edit-board="openEditBoard" @open-edit-collection="openEditCollection" />
			</div>

			<USeparator orientation="vertical" class="hidden sm:flex" />

			<SaveWidget class="hidden sm:inline-flex" />

			<CollectionToolbarButton class="hidden sm:inline-flex" :icon="'i-lucide-undo'" tooltip="Undo"
				:disabled="!canUndo" @click="bridge?.undo()" />

			<CollectionToolbarButton class="hidden sm:inline-flex" :icon="'i-lucide-redo'" tooltip="Redo"
				:disabled="!canRedo" @click="bridge?.redo()" />

			<CollectionToolbarButton class="hidden sm:inline-flex"
				:icon="autoLayoutPending ? 'i-lucide-loader-2' : 'i-lucide-layout-template'" tooltip="Auto layout"
				:spin="autoLayoutPending" :disabled="bridge === null" @click="bridge?.autoLayout()" />

			<CollectionToolbarButton class="hidden sm:inline-flex" :icon="'i-lucide-scan-search'"
				tooltip="Fit into view" :disabled="bridge === null" @click="bridge?.fitIntoView()" />
		</div>

		<div class="flex gap-2 items-center bg-default/70 backdrop-blur-sm  rounded-lg p-1.5 border border-default/40"
			:class="{ 'hidden': selected === null }">
			<CollectionToolbarButton :icon="'i-lucide-flip-horizontal'" tooltip="Flip X" :disabled="selected === null"
				@click="bridge?.flipSelectedImageX()" />

			<CollectionToolbarButton :icon="'i-lucide-folder-input'" tooltip="Move to collection"
				:disabled="selected === null || collectionsListPending || !hasAnotherCollection"
				@click="openMoveImage" />

			<CollectionToolbarButton :icon="'i-lucide-trash'" tooltip="Delete image" :disabled="selected === null"
				@click="openDeleteImage" />

			<CollectionToolbarButton :icon="'i-lucide-pencil'" tooltip="Edit image" :disabled="selected === null"
				@click="openImageEdit" />
		</div>
	</div>


	<CollectionEditModal v-model:open="editOpen" v-model:name="editName" :saving="saving" :error="editError"
		@save="saveEdit" />

	<CollectionImageEditModal v-model:open="imageEditOpen" v-model:source-url="imageEditSourceUrl"
		:saving="imageEditSaving" :error="imageEditError" @save="saveImageEdit" />

	<CollectionDeleteImageModal v-model:open="deleteOpen" :deleting="deleting" :error="deleteError"
		@confirm="confirmDeleteImage" />

	<CollectionMoveImageModal v-model:open="moveOpen" v-model:target-collection-id="moveTargetCollectionId"
		:groups="moveCollectionGroups" :collections-pending="collectionsListPending"
		:has-another-collection="hasAnotherCollection" :moving="moving" :error="moveError"
		@confirm="confirmMoveImage" />
</template>