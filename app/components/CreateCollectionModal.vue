<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import type { CollectionsListResponse } from '~/types/collections'
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const open = defineModel<boolean>('open', { required: true })

const props = defineProps<{
	folders: CollectionsListResponse['folders']
	initialFolderId?: string | null
}>()

const emit = defineEmits<{
	created: [collection: { id: string; name: string; folderId: string | null }]
}>()

const queryClient = useQueryClient()
const NO_FOLDER_VALUE = '__none__'

const newCollectionName = ref('')
const selectedFolderIdStr = ref(NO_FOLDER_VALUE)
const creatingCollection = ref(false)
const error = ref<string | null>(null)

const folderOptions = computed(() => [
	{ label: 'None', value: NO_FOLDER_VALUE },
	...props.folders.map((folder) => ({ label: folder.name, value: folder.id })),
])

watch(
	() => [open.value, props.initialFolderId] as const,
	([isOpen, initialFolderId]) => {
		if (!isOpen) {
			return
		}
		newCollectionName.value = ''
		selectedFolderIdStr.value = initialFolderId ?? NO_FOLDER_VALUE
		error.value = null
	},
	{ immediate: true }
)

function close(): void {
	if (creatingCollection.value) {
		return
	}
	open.value = false
	error.value = null
}

async function createCollection(): Promise<void> {
	const name = newCollectionName.value.trim()
	if (name.length === 0) {
		error.value = 'Enter a name for the new collection.'
		return
	}
	creatingCollection.value = true
	error.value = null
	try {
		const folderId = selectedFolderIdStr.value === NO_FOLDER_VALUE ? null : selectedFolderIdStr.value
		const res = await $fetch<{ collection: { id: string; name: string; folderId: string | null } }>(
			'/api/collections',
			{
				method: 'POST',
				body: { name, folderId },
			}
		)
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['folder'] })
		emit('created', res.collection)
		open.value = false
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Could not create collection')
	} finally {
		creatingCollection.value = false
	}
}
</script>

<template>
	<UModal
		v-model:open="open"
		title="Create collection"
		:close="!creatingCollection"
		:dismissible="!creatingCollection"
	>
		<template #body>
			<div class="space-y-4">
				<UFormField label="New collection">
					<UInput
						v-model="newCollectionName"
						type="text"
						placeholder="Name"
						autocomplete="off"
						class="w-full"
						:disabled="creatingCollection"
						@keydown.enter.prevent="createCollection"
					/>
				</UFormField>

				<UFormField label="Folder">
					<USelect
						v-model="selectedFolderIdStr"
						:items="folderOptions"
						value-key="value"
						class="w-full"
						:disabled="creatingCollection"
					/>
				</UFormField>

				<p v-if="error !== null" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-between gap-2 w-full">
				<UButton variant="soft" color="neutral" :disabled="creatingCollection" @click="close">Cancel</UButton>
				<UButton
					leading-icon="i-lucide-plus"
					loading-auto
					:loading="creatingCollection"
					:disabled="creatingCollection || newCollectionName.trim().length === 0"
					@click="createCollection"
				>
					{{ creatingCollection ? 'Creating…' : 'Create' }}
				</UButton>
			</div>
		</template>
	</UModal>
</template>
