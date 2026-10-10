<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { storeToRefs } from 'pinia';
import type { CollectionBoardSummary } from '~/types/boards';
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage';
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore';

const props = defineProps<{
	collectionId: string
	collectionName: string
	boards: CollectionBoardSummary[]
	activeBoardId: string
}>()

const reordering = defineModel<boolean>('reordering', { required: true })

const router = useRouter()
const queryClient = useQueryClient()

const viewerStore = useCollectionViewerStore()
const { dragOut } = storeToRefs(viewerStore)

function dropHoverFor(boardId: string): 'none' | 'valid' | 'pending' {
	const d = dragOut.value
	if (d === null || d.hoveredBoardId !== boardId) {
		return 'none'
	}
	return d.pending ? 'pending' : 'valid'
}

const reorderError = ref<string | null>(null)

const renamingId = ref<string | null>(null)
const renameValue = ref('')
const renameError = ref<string | null>(null)
const renameSaving = ref(false)

const deletingId = ref<string | null>(null)
const deleteConfirmId = ref<string | null>(null)
const deleteError = ref<string | null>(null)

async function refreshCollection(): Promise<void> {
	await queryClient.invalidateQueries({ queryKey: ['collection', props.collectionId] })
}

async function moveBoard(index: number, delta: -1 | 1): Promise<void> {
	const target = index + delta
	const ids = props.boards.map((b) => b.id)
	const moved = ids[index]
	const displaced = ids[target]
	if (moved === undefined || displaced === undefined) {
		throw new Error(`Board index out of range: ${index} -> ${target}`)
	}
	ids[index] = displaced
	ids[target] = moved
	try {
		await $fetch(`/api/collections/${props.collectionId}/boards/reorder`, { method: 'POST', body: { boardIds: ids } })
		await refreshCollection()
	} catch (e: unknown) {
		reorderError.value = fetchFormErrorMessage(e, 'Could not reorder boards')
	}
}

function switchBoard(boardId: string): void {
	if (boardId === props.activeBoardId) {
		return
	}
	// Navigation awaits route middleware before the next board mounts; show the overlay right away.
	viewerStore.setLoading(true)
	console.log('[board-loading] switch click', boardId)
	void router.push(`/collections/${props.collectionId}/boards/${boardId}`).then((failure) => {
		console.log('[board-loading] navigation settled', boardId, failure ?? 'ok')
		if (failure) {
			viewerStore.setLoading(false)
		}
	})
}

function startRename(board: CollectionBoardSummary): void {
	renamingId.value = board.id
	renameValue.value = board.name
	renameError.value = null
}

function cancelRename(): void {
	renamingId.value = null
	renameError.value = null
}

async function saveRename(boardId: string): Promise<void> {
	const name = renameValue.value.trim()
	if (name === '') {
		return
	}
	renameSaving.value = true
	renameError.value = null
	try {
		await $fetch(`/api/boards/${boardId}`, { method: 'PATCH', body: { name } })
		await refreshCollection()
		renamingId.value = null
	} catch (e: unknown) {
		renameError.value = fetchFormErrorMessage(e, 'Rename failed')
	} finally {
		renameSaving.value = false
	}
}

function askDelete(boardId: string): void {
	deleteConfirmId.value = boardId
	deleteError.value = null
}

function cancelDelete(): void {
	deleteConfirmId.value = null
}

async function confirmDelete(boardId: string): Promise<void> {
	deletingId.value = boardId
	deleteError.value = null
	try {
		await $fetch(`/api/boards/${boardId}`, { method: 'DELETE' })
		deleteConfirmId.value = null
		await refreshCollection()
		if (boardId === props.activeBoardId) {
			const fallback = props.boards.find((b) => b.id !== boardId)
			if (fallback !== undefined) {
				void router.push(`/collections/${props.collectionId}/boards/${fallback.id}`)
			}
		}
	} catch (e: unknown) {
		deleteError.value = fetchFormErrorMessage(e, 'Delete failed')
	} finally {
		deletingId.value = null
	}
}
</script>

<template>
	<div data-id="boards-sidebar" class="flex flex-col gap-2 px-2 py-3">

		<div data-id="boards-sidebar-list" class="flex flex-col gap-2">
			<CollectionBoardCard
v-for="(board, index) in boards" :key="board.id" :board="board"
				:reordering="reordering" :can-move-up="index > 0" :can-move-down="index < boards.length - 1"
				@move-up="moveBoard(index, -1)" @move-down="moveBoard(index, 1)"
				:active="board.id === activeBoardId" :renaming="renamingId === board.id"
				v-model:rename-value="renameValue" :rename-error="renamingId === board.id ? renameError : null"
				:rename-saving="renameSaving" :delete-confirming="deleteConfirmId === board.id"
				:delete-error="deleteConfirmId === board.id ? deleteError : null" :deleting="deletingId === board.id"
				:delete-disabled="boards.length <= 1" :drop-hover="dropHoverFor(board.id)"
				@select="switchBoard(board.id)" @rename-start="startRename(board)"
				@rename-cancel="cancelRename" @rename-save="saveRename(board.id)" @delete-ask="askDelete(board.id)"
				@delete-cancel="cancelDelete" @delete-confirm="confirmDelete(board.id)" />
		</div>

		<p v-if="reorderError" class="px-1 text-xs text-error">{{ reorderError }}</p>
	</div>
</template>
