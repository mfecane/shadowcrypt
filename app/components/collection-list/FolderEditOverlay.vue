<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

const target = useFolderEditOverlayState()
const queryClient = useQueryClient()

const name = ref('')
const archived = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const confirmDeleteOpen = ref(false)

watch(
	() => target.value,
	(t) => {
		if (t !== null) {
			name.value = t.name
			archived.value = t.archived
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
		await $fetch(`/api/folders/${t.id}`, {
			method: 'PATCH',
			body: { name: n, archived: archived.value },
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['folder', t.id] })
		close()
	} catch {
		error.value = 'Save failed'
	} finally {
		saving.value = false
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

function openDeleteConfirm(): void {
	error.value = null
	confirmDeleteOpen.value = true
}

function cancelDeleteConfirm(): void {
	confirmDeleteOpen.value = false
}

async function performDelete(): Promise<void> {
	const t = target.value
	if (t === null) {
		return
	}
	deleting.value = true
	error.value = null
	try {
		await $fetch(`/api/folders/${t.id}`, { method: 'DELETE' })
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['folder'] })
		await queryClient.invalidateQueries({ queryKey: ['folder', t.id] })
		confirmDeleteOpen.value = false
		close()
	} catch {
		error.value = 'Delete failed'
	} finally {
		deleting.value = false
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
		<Transition name="folder-edit-fade">
			<div
				v-if="open"
				class="fixed inset-0 z-220 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Edit folder"
				@click.self="close"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-5 shadow-2xl flex flex-col gap-4"
					@click.stop
				>
					<p class="text-muted text-xs font-medium tracking-wide uppercase">Edit folder</p>
					<label class="text-muted text-xs font-medium uppercase" for="folder-name-input">Name</label>
					<UInput id="folder-name-input" v-model="name" type="text" autocomplete="off" class="self-stretch" />
					<USwitch v-model="archived" :label="archived ? 'Archived' : 'Unarchived'" />
					<p v-if="error !== null && !confirmDeleteOpen" class="text-red-400 text-sm">{{ error }}</p>
					<div class="flex justify-end gap-2">
						<UButton
							color="error"
							size="sm"
							:disabled="saving || deleting"
							@click="openDeleteConfirm"
						>
							<template #icon>
								<Icon name="i-lucide-trash" class="h-4 w-4" />
							</template>
							Delete
						</UButton>
						<div class="flex justify-end gap-2">
							<UButton variant="soft" size="sm" :disabled="saving" @click="close"> Cancel </UButton>
							<UButton type="button" :disabled="saving" @click="save">
								<template #icon>
									<Icon v-if="saving" name="i-lucide-loader-circle" class="h-4 w-4 animate-spin" />
									<Icon v-else name="i-lucide-save" class="h-4 w-4" />
								</template>
								{{ saving ? 'Saving…' : 'Save' }}
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</Transition>

		<Transition name="folder-edit-fade">
			<div
				v-if="open && confirmDeleteOpen"
				class="fixed inset-0 z-230 flex items-center justify-center bg-black/50 p-3 backdrop-blur-[2px]"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="folder-delete-confirm-title"
				@click.self="cancelDeleteConfirm"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-sm rounded-xl border p-5 shadow-2xl"
					@click.stop
				>
					<p id="folder-delete-confirm-title" class="text-default mb-2 text-sm font-medium">
						Delete this folder?
					</p>
					<p class="text-muted mb-4 text-sm">
						“{{ name.trim() || 'Untitled' }}” will be removed. Collections inside it stay; they move to
						<strong class="text-default font-medium">None</strong> (ungrouped).
					</p>
					<p v-if="error !== null" class="text-red-400 mb-3 text-sm">{{ error }}</p>
					<div class="flex justify-end gap-2">
						<UButton variant="soft" size="sm" :disabled="deleting" @click="cancelDeleteConfirm">
							Cancel
						</UButton>
						<UButton color="error" size="sm" :disabled="deleting" @click="performDelete">
							<template #icon>
								<Icon v-if="deleting" name="i-lucide-loader-circle" class="h-4 w-4 animate-spin" />
								<Icon v-else name="i-lucide-trash" class="h-4 w-4" />
							</template>
							{{ deleting ? 'Deleting…' : 'Delete' }}
						</UButton>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.folder-edit-fade-enter-active,
.folder-edit-fade-leave-active {
	transition: opacity 0.15s ease;
}

.folder-edit-fade-enter-from,
.folder-edit-fade-leave-to {
	opacity: 0;
}
</style>
