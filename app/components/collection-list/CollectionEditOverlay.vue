<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { CollectionsListResponse } from '~/types/collections'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const target = useCollectionEditOverlayState()
const queryClient = useQueryClient()

const pinned = ref(false)
const name = ref('')
const archived = ref(false)
/** Empty string = no folder. */
const selectedFolderIdStr = ref('')
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
	if (
		t !== null &&
		t.folderId !== null &&
		!rows.some((r) => r.id === t.folderId)
	) {
		rows.push({ id: t.folderId, name: t.folder?.name ?? 'Folder' })
	}
	return rows.sort((a, b) => a.name.localeCompare(b.name))
})

watch(
	() => target.value,
	(t) => {
		if (t !== null) {
			name.value = t.name
			pinned.value = t.pinned
			archived.value = t.archived
			selectedFolderIdStr.value = t.folderId ?? ''
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
		const folderId = selectedFolderIdStr.value === '' ? null : selectedFolderIdStr.value
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

function onGlobalKeydown(e: KeyboardEvent): void {
	if (!open.value) {
		return
	}
	if (e.key === 'Escape') {
		e.preventDefault()
		if (confirmDeleteOpen.value) {
			cancelDeleteConfirm()
		} else {
			close()
		}
	}
}

onMounted(() => {
	document.addEventListener('keydown', onGlobalKeydown, { capture: true })
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onGlobalKeydown, { capture: true })
})
</script>

<template>
	<Teleport to="body">
		<Transition name="coll-edit-fade">
			<div
				v-if="open"
				class="fixed inset-0 z-220 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Edit collection"
				@click.self="close"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-5 shadow-2xl flex flex-col gap-4"
					@click.stop
				>
					<p class="text-muted text-sm font-medium tracking-wide uppercase">Edit collection</p>

					<UInput v-model="name" type="text" autocomplete="off" class="self-stretch" />

					<div>
						<label class="text-muted mb-1.5 block text-xs font-medium uppercase">Folder</label>
						<p v-if="foldersLoading" class="text-muted text-sm">Loading folders…</p>
						<select
							v-else
							v-model="selectedFolderIdStr"
							class="border-muted bg-muted/40 text-default focus:ring-beige-500/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
						>
							<option value="">None</option>
							<option v-for="opt in folderSelectOptions" :key="opt.id" :value="opt.id">
								{{ opt.name }}
							</option>
						</select>
						<div class="mt-3 flex gap-2">
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
								variant="soft"
								size="sm"
								icon="i-lucide-folder-plus"
								:disabled="creatingFolder || newFolderName.trim().length === 0"
								@click="createFolder"
							>
								{{ creatingFolder ? '…' : 'Add' }}
							</UButton>
						</div>
					</div>

					<USwitch v-model="pinned" :label="pinned ? 'Pinned' : 'Unpinned'" />

					<USwitch v-model="archived" :label="archived ? 'Archived' : 'Unarchived'" />

					<p v-if="error !== null && !confirmDeleteOpen" class="text-red-400 text-sm">{{ error }}</p>

					<div class="flex justify-between gap-2">
						<UButton
							color="error"
							size="sm"
							icon="i-lucide-trash"
							:disabled="saving || deleting"
							@click="openDeleteConfirm"
						>
							Delete
						</UButton>
						<div class="flex justify-end gap-2">
							<UButton variant="soft" :disabled="saving" @click="close"> Cancel </UButton>
							<UButton icon="i-lucide-save" :disabled="saving" @click="save">
								{{ saving ? 'Saving…' : 'Save' }}
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</Transition>

		<Transition name="coll-edit-fade">
			<div
				v-if="open && confirmDeleteOpen"
				class="fixed inset-0 z-230 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="collection-delete-confirm-title"
				@click.self="cancelDeleteConfirm"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-sm rounded-xl border p-5 shadow-2xl"
					@click.stop
				>
					<p id="collection-delete-confirm-title" class="text-default mb-2 text-sm font-medium">
						Delete this collection?
					</p>
					<p class="text-muted mb-4 text-sm">
						“{{ name.trim() || 'Untitled' }}” and its images will be removed permanently. This cannot be
						undone.
					</p>
					<p v-if="error !== null" class="text-red-400 mb-3 text-sm">{{ error }}</p>
					<div class="flex justify-end gap-2">
						<UButton variant="soft" :disabled="deleting" @click="cancelDeleteConfirm"> Cancel </UButton>
						<UButton color="error" icon="i-lucide-trash" :disabled="deleting" @click="performDelete">
							{{ deleting ? 'Deleting…' : 'Delete' }}
						</UButton>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.coll-edit-fade-enter-active,
.coll-edit-fade-leave-active {
	transition: opacity 0.15s ease;
}

.coll-edit-fade-enter-from,
.coll-edit-fade-leave-to {
	opacity: 0;
}
</style>
