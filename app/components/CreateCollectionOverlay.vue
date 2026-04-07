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

const newCollectionName = ref('')
const selectedFolderIdStr = ref('')
const creatingCollection = ref(false)
const error = ref<string | null>(null)

watch(
	() => [open.value, props.initialFolderId] as const,
	([isOpen, initialFolderId]) => {
		if (!isOpen) {
			return
		}
		newCollectionName.value = ''
		selectedFolderIdStr.value = initialFolderId ?? ''
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
		const folderId = selectedFolderIdStr.value === '' ? null : selectedFolderIdStr.value
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

function onKeydown(event: KeyboardEvent): void {
	if (!open.value) {
		return
	}
	if (event.key === 'Escape') {
		event.preventDefault()
		close()
	}
}

onMounted(() => {
	document.addEventListener('keydown', onKeydown, { capture: true })
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onKeydown, { capture: true })
})
</script>

<template>
	<Teleport to="body">
		<Transition name="create-collection-fade">
			<div
				v-if="open"
				class="fixed inset-0 z-220 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Create collection"
				@click.self="close"
			>
				<div
					class="bg-elevated border-muted w-full max-w-md rounded-xl border p-5 shadow-2xl flex flex-col gap-4"
					@click.stop
				>
					<h2 class="text-muted text-sm font-medium tracking-wide uppercase">Create collection</h2>

					<div>
						<label class="text-muted mb-1 block text-[11px] font-medium uppercase tracking-wide">
							New collection
						</label>
						<input
							v-model="newCollectionName"
							type="text"
							class="border-muted bg-muted/40 text-default focus:ring-beige-500/40 min-w-0 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
							placeholder="Name"
							autocomplete="off"
							:disabled="creatingCollection"
							@keydown.enter.prevent="createCollection"
						>
					</div>

					<div>
						<label class="text-muted mb-1.5 block text-[11px] font-medium uppercase tracking-wide">
							Folder
						</label>
						<select
							v-model="selectedFolderIdStr"
							class="border-muted bg-muted/40 text-default focus:ring-beige-500/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
							:disabled="creatingCollection"
						>
							<option value="">None</option>
							<option v-for="folder in folders" :key="folder.id" :value="folder.id">
								{{ folder.name }}
							</option>
						</select>
					</div>

					<p v-if="error !== null" class="text-red-400 text-sm">{{ error }}</p>

					<div class="flex justify-between gap-2">
						<UButton variant="ghost" :disabled="creatingCollection" @click="close">Cancel</UButton>

						<UButton
							:disabled="creatingCollection || newCollectionName.trim().length === 0"
							@click="createCollection"
						>
							<template #leading>
								<Icon
									v-if="creatingCollection"
									name="i-lucide-loader-circle"
									class="h-4 w-4 animate-spin"
									aria-hidden="true"
								/>
								<Icon v-else name="i-lucide-plus" class="h-4 w-4" aria-hidden="true" />
							</template>
							{{ creatingCollection ? 'Creating…' : 'Create' }}
						</UButton>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.create-collection-fade-enter-active,
.create-collection-fade-leave-active {
	transition: opacity 0.15s ease;
}

.create-collection-fade-enter-from,
.create-collection-fade-leave-to {
	opacity: 0;
}
</style>
