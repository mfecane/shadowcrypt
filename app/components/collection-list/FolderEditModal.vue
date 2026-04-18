<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const target = useFolderEditModalState()
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
		title="Edit folder"
		:close="!(saving || deleting || confirmDeleteOpen)"
		:dismissible="!(saving || deleting || confirmDeleteOpen)"
		@update:open="(value) => { if (!value) close() }"
	>
		<template #body>
			<div class="space-y-4">
				<UFormField label="Name">
					<UInput id="folder-name-input" v-model="name" type="text" autocomplete="off" class="w-full" />
				</UFormField>
				<USwitch v-model="archived" :label="archived ? 'Archived' : 'Unarchived'" />
				<p v-if="error !== null && !confirmDeleteOpen" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<UButton color="error" variant="soft" size="sm" :disabled="saving || deleting" @click="openDeleteConfirm">
				Delete
			</UButton>
			<UButton variant="soft" color="neutral" size="sm" :disabled="saving" @click="close">Cancel</UButton>
			<UButton leading-icon="i-lucide-save" type="button" :loading="saving" :disabled="saving" @click="save">
				{{ saving ? 'Saving…' : 'Save' }}
			</UButton>
		</template>
	</UModal>

	<UModal
		v-model:open="confirmDeleteOpen"
		title="Delete this folder?"
		:close="!deleting"
		:dismissible="!deleting"
		@update:open="(value) => { if (!value) cancelDeleteConfirm() }"
	>
		<template #body>
			<div class="space-y-4">
				<p class="text-sm text-muted">
					“{{ name.trim() || 'Untitled' }}” will be removed. Collections inside it stay; they move to
					<strong class="text-default font-medium">None</strong> (ungrouped).
				</p>
				<p v-if="error !== null" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<UButton variant="soft" color="neutral" size="sm" :disabled="deleting" @click="cancelDeleteConfirm">
				Cancel
			</UButton>
			<UButton color="error" size="sm" :loading="deleting" :disabled="deleting" @click="performDelete">
				{{ deleting ? 'Deleting…' : 'Delete' }}
			</UButton>
		</template>
	</UModal>
</template>
