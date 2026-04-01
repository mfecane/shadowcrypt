<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import CollectionToolbarButton from '~/components/collection/CollectionToolbarButton.vue'
import SaveWidget from '~/components/collection/SaveWidget.vue'
import { useBoardBridgeState } from '~/components/collection/useBoardBridgeState'
import { useCollectionViewerStore } from '~/stores/collectionViewer'
import type { CollectionDetail } from '~/types/collections'
import { nn } from '~~/lib/collectionViewer/viewerUtils'

const props = defineProps<{ detail: CollectionDetail }>()

const store = useCollectionViewerStore()

const { state } = useBoardBridgeState()

const collectionId = computed(() => state.collectionId ?? props.detail.id)
const collectionName = computed(() => state.collectionName || props.detail.name)
const selected = computed(() => state.selectedImageId)
const canUndo = computed(() => state.canUndo)
const canRedo = computed(() => state.canRedo)

const router = useRouter()
const queryClient = useQueryClient()

const editOpen = ref(false)
const deleteOpen = ref(false)
const editName = ref('')
const saving = ref(false)
const deleting = ref(false)

function openEdit(): void {
	editName.value = collectionName.value
	editOpen.value = true
}

async function saveEdit(): Promise<void> {
	const name = editName.value.trim()
	if (name === '') {
		return
	}
	saving.value = true
	try {
		await $fetch(`/api/collections/${collectionId.value}`, {
			method: 'PATCH',
			body: { name },
		})
		store.board?.setCollectionName(name)
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', collectionId.value] })
		editOpen.value = false
	} finally {
		saving.value = false
	}
}

function openDeleteImage(): void {
	if (selected.value === null) {
		return
	}
	deleteOpen.value = true
}

async function confirmDeleteImage(): Promise<void> {
	const imageId = nn(selected.value)
	deleting.value = true
	try {
		await $fetch(`/api/collections/${collectionId.value}/images/${imageId}`, {
			method: 'DELETE',
		})
		store.board?.removeImage(imageId)
		await queryClient.invalidateQueries({ queryKey: ['collection', collectionId.value] })
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		deleteOpen.value = false
		// Board owns selection; no-op here.
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<div
		:class="[
			'absolute left-2 top-2 z-100 flex items-center rounded-lg bg-neutral-900/70 p-2 backdrop-blur-sm',
			'transition-all duration-300 ease-in-out',
		]"
	>
		<CollectionToolbarButton :icon="'i-lucide-chevron-left'" aria-label="Back" @click="router.push('/list')" />

		<div class="mx-2 text-sm min-w-40 text-toned">{{ collectionName }}</div>

		<CollectionToolbarButton :icon="'i-heroicons-pencil-square'" aria-label="Edit" @click="openEdit" />

		<CollectionToolbarButton
			:icon="'i-lucide-undo'"
			aria-label="Undo"
			:disabled="!canUndo"
			@click="store.board?.undo()"
		/>

		<CollectionToolbarButton
			:icon="'i-lucide-redo'"
			aria-label="Redo"
			:disabled="!canRedo"
			@click="store.board?.redo()"
		/>

		<CollectionToolbarButton
			:icon="'i-lucide-scan-search'"
			aria-label="Fit all images to view"
			:disabled="store.board === null"
			@click="store.board?.fitWorldToView()"
		/>

		<CollectionToolbarButton
			:icon="'i-lucide-trash'"
			aria-label="Delete image"
			:disabled="selected === null"
			@click="openDeleteImage"
		/>

		<SaveWidget />
	</div>

	<CollectionEditModal v-model:open="editOpen" v-model:name="editName" :saving="saving" @save="saveEdit" />

	<Teleport to="body">
		<div
			v-if="deleteOpen"
			class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
			@click.self="deleteOpen = false"
		>
			<div class="bg-elevated border-muted w-full max-w-md rounded-lg border p-6 shadow-xl">
				<h2 class="text-highlighted mb-4 text-lg font-semibold">Delete image?</h2>
				<p class="text-muted mb-6 text-sm">This cannot be undone.</p>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="text-muted hover:text-highlighted rounded px-4 py-2 text-sm"
						@click="deleteOpen = false"
					>
						Cancel
					</button>
					<button
						type="button"
						class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
						:disabled="deleting"
						@click="confirmDeleteImage"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>
