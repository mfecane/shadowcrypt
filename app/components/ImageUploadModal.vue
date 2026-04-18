<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import CollectionsSelector from '~/components/CollectionsSelector.vue'
import CreateCollectionModal from '~/components/CreateCollectionModal.vue'
import type { CollectionImageUploadResponse, CollectionListItem, CollectionsListResponse } from '~/types/collections'
import { MAX_COLLECTION_IMAGE_UPLOAD_BYTES } from '~~/lib/config/image'
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
	for (const c of res.pinned) {
		push(c)
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

function dataTransferHasImage(dt: DataTransfer | null): boolean {
	if (dt === null) {
		return false
	}
	for (const item of dt.items) {
		if (item.kind === 'file' && item.type.startsWith('image/')) {
			return true
		}
	}
	return false
}

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

function firstImageUrlFromDataTransfer(dt: DataTransfer | null): string | null {
	if (dt === null) {
		return null
	}
	for (const type of ['text/uri-list', 'text/plain']) {
		const value = dt.getData(type).trim()
		if (value.length === 0) {
			continue
		}
		const firstLine = value
			.split('\n')
			.map((line) => line.trim())
			.find((line) => line.length > 0 && !line.startsWith('#'))
		if (firstLine !== undefined && isHttpUrl(firstLine)) {
			return firstLine
		}
	}
	return null
}

function dataTransferHasImagePayload(dt: DataTransfer | null): boolean {
	return dataTransferHasImage(dt) || firstImageUrlFromDataTransfer(dt) !== null
}

function firstImageFromDataTransfer(dt: DataTransfer | null): File | null {
	if (dt === null) {
		return null
	}
	for (const item of dt.items) {
		if (item.kind === 'file' && item.type.startsWith('image/')) {
			const f = item.getAsFile()
			if (f !== null) {
				return f
			}
		}
	}
	const files = dt.files
	if (files !== null && files.length > 0) {
		for (let i = 0; i < files.length; i++) {
			const f = files.item(i)
			if (f !== null && f.type.startsWith('image/')) {
				return f
			}
		}
	}
	return null
}

function firstImageFromClipboard(cb: DataTransfer | null): File | null {
	if (cb === null) {
		return null
	}
	for (const item of cb.items) {
		if (item.kind === 'file' && item.type.startsWith('image/')) {
			const f = item.getAsFile()
			if (f !== null) {
				return f
			}
		}
	}
	return null
}

const route = useRoute()
const queryClient = useQueryClient()
const { open, openModal, closeModal: closeModalState, isTargetRoute } = useImageUploadModal()
const showFab = computed(() => isTargetRoute.value && !open.value)
const createCollectionModal = ref(false)

const collectionIdFromRoute = computed(() => {
	const m = /^\/collections\/([^/]+)$/.exec(route.path)
	return m?.[1] ?? null
})

/** When on `/list/:folderId`, new collections are created inside that folder. */
const folderIdFromRoute = computed(() => {
	const m = /^\/list\/([^/]+)$/.exec(route.path)
	return m?.[1] ?? null
})

const file = ref<File | null>(null)
const localPreviewUrl = ref<string | null>(null)
const imageUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const uploading = ref(false)
const selectedCollectionId = ref<string | null>(null)
const inputSource = ref<'none' | 'file' | 'clipboard-image' | 'url'>('none')
const fileInputEl = ref<HTMLInputElement | null>(null)

const previewUrl = computed(() => imageUrl.value ?? localPreviewUrl.value)

const { data: collectionsData, isPending: collectionsPending } = useQuery({
	queryKey: ['collections'],
	queryFn: () => $fetch<CollectionsListResponse>('/api/collections'),
	enabled: computed(() => isTargetRoute.value),
})

const flatCollections = computed(() =>
	collectionsData.value !== undefined ? flattenCollectionsDeduped(collectionsData.value) : []
)

const collectionGroups = computed(() =>
	collectionsData.value !== undefined ? groupedCollectionOptions(collectionsData.value) : []
)

watch(
	[flatCollections, collectionIdFromRoute],
	() => {
		const fromRoute = collectionIdFromRoute.value
		if (fromRoute !== null && flatCollections.value.some((c) => c.id === fromRoute)) {
			selectedCollectionId.value = fromRoute
			return
		}
		const current = selectedCollectionId.value
		if (current !== null && flatCollections.value.some((c) => c.id === current)) {
			return
		}
		const first = flatCollections.value[0]
		selectedCollectionId.value = first !== undefined ? first.id : null
	},
	{ immediate: true }
)

watch(file, (f) => {
	if (localPreviewUrl.value !== null) {
		URL.revokeObjectURL(localPreviewUrl.value)
		localPreviewUrl.value = null
	}
	if (f !== null) {
		localPreviewUrl.value = URL.createObjectURL(f)
	}
})

function setFile(next: File | null, source: 'file' | 'clipboard-image' = 'file'): void {
	file.value = next
	imageUrl.value = null
	inputSource.value = next === null ? 'none' : source
	if (next === null && fileInputEl.value !== null) {
		fileInputEl.value.value = ''
	}
	error.value = null
}

function setImageUrl(next: string | null): void {
	file.value = null
	imageUrl.value = next
	inputSource.value = next === null ? 'none' : 'url'
	if (fileInputEl.value !== null) {
		fileInputEl.value.value = ''
	}
	error.value = null
}

function close(): void {
	closeModalState()
	clearImage()
	uploading.value = false
	error.value = null
	createCollectionModal.value = false
}

function openFromClipboardOrDrag(): void {
	if (!isTargetRoute.value) {
		return
	}
	openModal()
}

function onWindowDragEnter(e: DragEvent): void {
	if (!isTargetRoute.value || !dataTransferHasImagePayload(e.dataTransfer)) {
		return
	}
	e.preventDefault()
	openFromClipboardOrDrag()
}

function onWindowDragOver(e: DragEvent): void {
	if (!isTargetRoute.value) {
		return
	}
	if (!dataTransferHasImagePayload(e.dataTransfer)) {
		return
	}
	e.preventDefault()
}

function onPanelDrop(e: DragEvent): void {
	const f = firstImageFromDataTransfer(e.dataTransfer)
	if (f !== null) {
		setFile(f)
		return
	}
	const url = firstImageUrlFromDataTransfer(e.dataTransfer)
	if (url !== null) {
		setImageUrl(url)
		return
	}
	if (imageUrl.value !== null) {
		error.value = 'Drop an image URL or image file.'
		return
	}
	error.value = 'Drop an image file or image URL.'
}

function onPaste(e: ClipboardEvent): void {
	if (!isTargetRoute.value) {
		return
	}
	const t = e.target
	if (t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)) {
		return
	}
	if (t instanceof HTMLInputElement && ['text', 'password', 'search', 'email', 'tel', 'number'].includes(t.type)) {
		return
	}
	const f = firstImageFromClipboard(e.clipboardData)
	if (f !== null) {
		e.preventDefault()
		openFromClipboardOrDrag()
		setFile(f, 'clipboard-image')
		return
	}
	const url = firstImageUrlFromDataTransfer(e.clipboardData)
	if (url === null) {
		return
	}
	e.preventDefault()
	openFromClipboardOrDrag()
	setImageUrl(url)
}

async function submitUpload(): Promise<void> {
	const cid = selectedCollectionId.value
	const f = file.value
	const url = imageUrl.value?.trim() ?? ''
	if (cid === null || (f === null && url === '')) {
		error.value = 'Choose a collection and provide an image.'
		return
	}
	if (f !== null && f.size > MAX_COLLECTION_IMAGE_UPLOAD_BYTES) {
		error.value = `Image is too large (max ${Math.round(MAX_COLLECTION_IMAGE_UPLOAD_BYTES / (1024 * 1024))} MB).`
		return
	}
	uploading.value = true
	error.value = null
	const body = new FormData()
	if (f !== null) {
		body.append('file', f)
	} else {
		body.append('url', url)
	}
	try {
		await $fetch<CollectionImageUploadResponse>(`/api/collections/${cid}/images`, {
			method: 'POST',
			body,
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', cid] })
		close()
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Upload failed')
	} finally {
		uploading.value = false
	}
}

function clearImage(): void {
	setImageUrl(null)
	setFile(null)
}

function onFileInputChange(event: Event): void {
	const target = event.target
	if (!(target instanceof HTMLInputElement)) {
		return
	}
	const next = target.files?.item(0) ?? null
	if (next === null) {
		return
	}
	if (!next.type.startsWith('image/')) {
		error.value = 'Select an image file.'
		target.value = ''
		return
	}
	setFile(next)
}

onMounted(() => {
	if (!import.meta.client) {
		return
	}
	window.addEventListener('dragenter', onWindowDragEnter)
	window.addEventListener('dragover', onWindowDragOver)
	document.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
	if (import.meta.client) {
		if (localPreviewUrl.value !== null) {
			URL.revokeObjectURL(localPreviewUrl.value)
		}
		window.removeEventListener('dragenter', onWindowDragEnter)
		window.removeEventListener('dragover', onWindowDragOver)
		document.removeEventListener('paste', onPaste)
	}
})

function openCreateCollectionModal(): void {
	createCollectionModal.value = true
}

function onCollectionCreated(collection: { id: string }): void {
	selectedCollectionId.value = collection.id
	error.value = null
}
</script>
<template>
	<div v-show="showFab">
		<GlassFabButton aria-label="Add image to collection" @click="openModal" tooltip="Add image to collection" />
	</div>
	<Teleport to="body">
		<UModal
			v-model:open="open"
			:transition="false"
			title="Upload image to collection"
			@close="close"
			@dragover.prevent
			@drop="onPanelDrop"
			:modal="true"
		>
			<template #body>
				<UForm id="image-upload-form" class="space-y-4" @submit.prevent="submitUpload">
					<p class="text-muted mt-1 text-xs">Drop, paste, pick or create a collection, then upload.</p>

					<UFormField label="Collection">
						<p v-if="collectionsPending" class="text-muted flex items-center gap-2 text-sm">
							<Icon name="i-lucide-loader-circle" class="size-4 animate-spin" aria-hidden="true" />
							Loading collections…
						</p>
						<template v-else>
							<div v-if="flatCollections.length > 0" class="flex items-stretch gap-2">
								<CollectionsSelector
									v-model="selectedCollectionId"
									:groups="collectionGroups"
									placeholder="Select collection"
								/>
								<UButton
									type="button"
									class="grid w-12 flex-none place-items-center self-stretch"
									@click="openCreateCollectionModal"
									icon="i-lucide-plus"
								>
								</UButton>
							</div>
							<div v-else class="text-muted mb-2 flex flex-col items-start gap-2 text-sm">
								<p>No collections yet.</p>
								<UButton type="button" icon="i-lucide-plus" @click="openCreateCollectionModal">
									Create collection
								</UButton>
							</div>
						</template>
					</UFormField>

					<div
						class="border-muted bg-muted/30 flex h-96 min-h-0 flex-col rounded-lg border border-dashed p-3"
					>
						<div v-if="previewUrl !== null" class="relative min-h-0 flex-1 overflow-hidden rounded-md">
							<UButton
								type="button"
								variant="ghost"
								class="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full border-none p-0"
								@click="clearImage()"
							>
								<Icon name="i-lucide-x" class="size-4" aria-hidden="true" />
							</UButton>
							<img :src="previewUrl" alt="" class="h-full w-full object-cover" />
						</div>
						<div v-else class="flex min-h-0 flex-1 items-center justify-center">
							<p class="text-muted mx-auto max-w-sm text-center text-sm">
								Drop an image here, paste an image, or paste/drag an image URL.
							</p>
						</div>
					</div>

					<div class="mt-3 space-y-3">
						<div v-if="imageUrl !== null" class="flex items-center gap-2">
							<UInput v-model="imageUrl" type="url" class="min-w-0 flex-1" />
							<UButton type="button" variant="soft" color="neutral" @click="clearImage">Clear</UButton>
						</div>

						<UFormField
							label="Upload from drive"
							v-if="imageUrl === null && inputSource !== 'clipboard-image'"
						>
							<UInput
								size="md"
								ref="fileInputEl"
								type="file"
								accept="image/*"
								class="w-full"
								:disabled="uploading"
								@change="onFileInputChange"
							/>
						</UFormField>
					</div>

					<p v-if="error !== null" class="text-sm text-red-400">{{ error }}</p>
				</UForm>
			</template>

			<template #footer>
				<div class="flex justify-between gap-2 w-full">
					<UButton type="button" color="neutral" variant="outline" :disabled="uploading" @click="close">
						Cancel
					</UButton>
					<UButton
						type="submit"
						form="image-upload-form"
						:disabled="uploading || (file === null && imageUrl === null) || selectedCollectionId === null"
					>
						<template #leading>
							<Icon v-if="!uploading" name="i-lucide-upload" class="size-4" aria-hidden="true" />
							<Icon v-else name="i-lucide-loader-circle" class="size-4 animate-spin" aria-hidden="true" />
						</template>
						{{ uploading ? 'Uploading…' : 'Upload' }}
					</UButton>
				</div>
			</template>
		</UModal>
	</Teleport>

	<CreateCollectionModal
		v-model:open="createCollectionModal"
		:folders="collectionsData?.folders ?? []"
		:initial-folder-id="folderIdFromRoute"
		@created="onCollectionCreated"
	/>
</template>
