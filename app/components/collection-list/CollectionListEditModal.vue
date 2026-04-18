<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { CollectionsListResponse } from '~/types/collections'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const target = useCollectionListEditModalState()
const queryClient = useQueryClient()
const NO_FOLDER_VALUE = '__none__'

const pinned = ref(false)
const name = ref('')
const archived = ref(false)
const selectedFolderIdStr = ref(NO_FOLDER_VALUE)
const newFolderName = ref('')
const creatingFolder = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const confirmDeleteOpen = ref(false)

const { data: collectionsData, isPending: foldersLoading } = useQuery({
	queryKey: ['collections'],
	queryFn: () => $fetch<CollectionsListResponse>('/api/collections'),
	enabled: computed(() => target.value !== null),
})

const folderSelectOptions = computed(() => {
	const d = collectionsData.value
	const t = target.value
	const rows: { id: string; name: string }[] = []
	if (d !== undefined) {
		for (const f of d.folders) {
			rows.push({ id: f.id, name: f.name })
		}
	}
	if (t !== null && t.folderId !== null && !rows.some((r) => r.id === t.folderId)) {
		rows.push({ id: t.folderId, name: t.folder?.name ?? 'Folder' })
	}
	return rows.sort((a, b) => a.name.localeCompare(b.name))
})

const folderSelectItems = computed(() => [
	{ label: 'None', value: NO_FOLDER_VALUE },
	...folderSelectOptions.value.map((folder) => ({ label: folder.name, value: folder.id })),
])

watch(
	() => target.value,
	(t) => {
		if (t !== null) {
			name.value = t.name
			pinned.value = t.pinned
			archived.value = t.archived
			selectedFolderIdStr.value = t.folderId ?? NO_FOLDER_VALUE
			newFolderName.value = ''
			error.value = null
		}
	},
	{ immediate: true }
)

const open = computed(() => target.value !== null)

function close(): void {
	confirmDeleteOpen.value = false
	target.value = null
}

async function save(): Promise<void> {
	const t = target.value
	if (t === null) {
		return
	}
	const n = name.value.trim()
	if (n.length === 0) {
		error.value = 'Name is required'
		return
	}
	saving.value = true
	error.value = null
	try {
		const folderId = selectedFolderIdStr.value === NO_FOLDER_VALUE ? null : selectedFolderIdStr.value
		await $fetch(`/api/collections/${t.id}`, {
			method: 'PATCH',
			body: {
				name: name.value,
				pinned: pinned.value,
				archived: archived.value,
				folderId,
			},
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', t.id] })
		await queryClient.invalidateQueries({ queryKey: ['folder'] })
		close()
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Save failed')
	} finally {
		saving.value = false
	}
}

function openDeleteConfirm(): void {
	error.value = null
	confirmDeleteOpen.value = true
}

function cancelDeleteConfirm(): void {
	confirmDeleteOpen.value = false
}

async function createFolder(): Promise<void> {
	const n = newFolderName.value.trim()
	if (n.length === 0) {
		error.value = 'Enter a folder name'
		return
	}
	creatingFolder.value = true
	error.value = null
	try {
		const res = await $fetch<{ folder: { id: string; name: string } }>('/api/folders', {
			method: 'POST',
			body: { name: n },
		})
		newFolderName.value = ''
		selectedFolderIdStr.value = res.folder.id
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['folder'] })
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Could not create folder')
	} finally {
		creatingFolder.value = false
	}
}

async function performDelete(): Promise<void> {
	const t = target.value
	if (t === null) {
		return
	}
	deleting.value = true
	error.value = null
	try {
		await $fetch(`/api/collections/${t.id}`, {
			method: 'DELETE',
			body: { id: t.id },
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', t.id] })
		await queryClient.invalidateQueries({ queryKey: ['folder'] })
		confirmDeleteOpen.value = false
		close()
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Delete failed')
	} finally {
		deleting.value = false
	}
}
</script>

<template>
	<UModal
		:open="open"
		title="Edit collection"
		:close="!(saving || creatingFolder || deleting || confirmDeleteOpen)"
		:dismissible="!(saving || creatingFolder || deleting || confirmDeleteOpen)"
		@update:open="
			(value) => {
				if (!value) close()
			}
		"
	>
		<template #body>
			<div class="space-y-6">
				<UFormField label="Name">
					<UInput v-model="name" type="text" autocomplete="off" class="w-full" />
				</UFormField>

				<div class="space-y-2">
					<UFormField label="Folder">
						<p v-if="foldersLoading" class="text-muted text-sm">Loading folders…</p>
						<USelect
							v-else
							v-model="selectedFolderIdStr"
							:items="folderSelectItems"
							value-key="value"
							class="w-full"
						/>
					</UFormField>
					<div class="flex gap-2">
						<UInput
							v-model="newFolderName"
							type="text"
							class="min-w-0 flex-1"
							placeholder="New folder name"
							autocomplete="off"
							:disabled="creatingFolder"
							@keydown.enter.prevent="createFolder"
						/>
						<UButton
							leading-icon="i-lucide-folder-plus"
							:loading="creatingFolder"
							:disabled="creatingFolder || newFolderName.trim().length === 0"
							@click="createFolder"
						>
							Add
						</UButton>
					</div>
				</div>

				<USwitch v-model="pinned" :label="pinned ? 'Pinned' : 'Unpinned'" />
				<USwitch v-model="archived" :label="archived ? 'Archived' : 'Unarchived'" />

				<p v-if="error !== null && !confirmDeleteOpen" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-between gap-2 w-full">
				<UButton
					color="error"
					variant="soft"
					size="sm"
					leading-icon="i-lucide-trash"
					:disabled="saving || deleting"
					@click="openDeleteConfirm"
				>
					Delete
				</UButton>
				<div class="flex gap-2">
					<UButton color="neutral" variant="outline" :disabled="saving" @click="close">Cancel</UButton>
					<UButton leading-icon="i-lucide-save" :loading="saving" :disabled="saving" @click="save">
						{{ saving ? 'Saving…' : 'Save' }}
					</UButton>
				</div>
			</div>
		</template>
	</UModal>

	<UModal
		v-model:open="confirmDeleteOpen"
		title="Delete this collection?"
		:close="!deleting"
		:dismissible="!deleting"
		@update:open="
			(value) => {
				if (!value) cancelDeleteConfirm()
			}
		"
	>
		<template #body>
			<div class="space-y-4">
				<p class="text-sm text-muted">
					“{{ name.trim() || 'Untitled' }}” and its images will be removed permanently. This cannot be undone.
				</p>
				<p v-if="error !== null" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<UButton variant="soft" color="neutral" :disabled="deleting" @click="cancelDeleteConfirm">Cancel</UButton>
			<UButton
				color="error"
				leading-icon="i-lucide-trash"
				:loading="deleting"
				:disabled="deleting"
				@click="performDelete"
			>
				{{ deleting ? 'Deleting…' : 'Delete' }}
			</UButton>
		</template>
	</UModal>
</template>
