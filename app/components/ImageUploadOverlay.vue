<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import CollectionsSelector from '~/components/CollectionsSelector.vue'
import CreateCollectionOverlay from '~/components/CreateCollectionOverlay.vue'
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
const { open, openOverlay, closeOverlay: closeOverlayState } = useImageUploadOverlay()
const createCollectionModal = ref(false)

const isTargetRoute = computed(() => {
	const p = route.path
	return p === '/list' || /^\/list\/[^/]+$/.test(p) || /^\/collections\/[^/]+$/.test(p)
})

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

// remote pinned from here
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
	closeOverlayState()
	clearImage()
	uploading.value = false
	error.value = null
	createCollectionModal.value = false
}

watch(open, (v) => {
	if (import.meta.client) {
		document.body.style.overflow = v ? 'hidden' : ''
	}
})

watch(isTargetRoute, (ok) => {
	if (!ok && open.value) {
		close()
	}
})

function openFromClipboardOrDrag(): void {
	if (!isTargetRoute.value) {
		return
	}
	openOverlay()
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
	if (
		t instanceof HTMLInputElement ||
		t instanceof HTMLTextAreaElement ||
		(t instanceof HTMLElement && t.isContentEditable)
	) {
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

function onGlobalKeydown(e: KeyboardEvent): void {
	if (!open.value) {
		return
	}
	if (e.key === 'Escape') {
		e.preventDefault()
		close()
	}
}

watch(open, (v: boolean) => {
	document.body.style.overflow = v ? 'hidden' : ''
})

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
	document.addEventListener('keydown', onGlobalKeydown, { capture: true })
})

onBeforeUnmount(() => {
	if (import.meta.client) {
		document.body.style.overflow = ''
		if (localPreviewUrl.value !== null) {
			URL.revokeObjectURL(localPreviewUrl.value)
		}
		window.removeEventListener('dragenter', onWindowDragEnter)
		window.removeEventListener('dragover', onWindowDragOver)
		document.removeEventListener('paste', onPaste)
		document.removeEventListener('keydown', onGlobalKeydown, { capture: true })
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
	<Teleport to="body">
		<Transition name="imgupload-fade">
			<div
				v-if="open && isTargetRoute"
				class="fixed inset-0 z-210 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Upload image to collection"
				@click.self="close"
			>
				<div
					class="border-muted bg-elevated text-default flex w-full max-w-md flex-col rounded-xl border shadow-2xl"
					@click.stop
					@dragover.prevent
					@drop="onPanelDrop"
				>
					<div class="border-muted flex items-start justify-between border-b px-4 py-3">
						<div>
							<p class="text-foreground text-md font-medium tracking-wide uppercase mb-2">Add image</p>
							<p class="text-muted mt-1 text-xs">
								Drop, paste, pick or create a collection, then upload.
							</p>
						</div>
						<UButton variant="ghost" aria-label="Close" @click="close">
							<Icon name="i-lucide-x" class="h-4 w-4" aria-hidden="true" />
						</UButton>
					</div>

					<div class="flex flex-col gap-4 px-4 py-4">
						<label class="text-foreground block text-xs font-medium uppercase">Collection</label>
						<p v-if="collectionsPending" class="text-muted text-sm">Loading collections…</p>
						<template v-else>
							<div v-if="flatCollections.length > 0" class="flex gap-2 items-stretch">
								<CollectionsSelector
									v-model="selectedCollectionId"
									:groups="collectionGroups"
									placeholder="Select collection"
								/>
								<UButton
									class="self-stretch w-12 grid place-items-center"
									@click="openCreateCollectionModal"
								>
									<Icon name="i-lucide-plus" class="h-4 w-4" aria-hidden="true" />
								</UButton>
							</div>
							<div v-else class="text-muted mb-2 flex flex-col items-start gap-2 text-sm">
								<p>No collections yet — add one below.</p>
								<UButton icon="i-lucide-plus" @click="openCreateCollectionModal">
									Create collection
								</UButton>
							</div>
						</template>

						<div class="h-96 border-muted bg-neutral-800 flex flex-col rounded-lg border border-dashed p-3">
							<div v-if="previewUrl !== null" class="relative min-h-0 flex-1 overflow-hidden rounded-md">
								<UButton
									variant="ghost"
									class="absolute top-2 right-2 z-10 rounded-full w-8 h-8 text-foreground hover:bg-neutral-700/70 bg-neutral-900/70 backdrop-blur-sm grid place-items-center border-none p-0"
									@click="clearImage()"
								>
									<Icon name="i-lucide-x" class="h-4 w-4" aria-hidden="true" />
								</UButton>
								<img :src="previewUrl" alt="" class="w-full h-full object-cover">
							</div>
							<div v-else class="flex min-h-0 flex-1 items-center justify-center text-center">
								<p class="text-muted text-sm max-w-56">
									Drop an image here, paste an image, or paste/drag an image URL.
								</p>
							</div>
						</div>

						<div class="mt-3 space-y-3">
							<div v-if="imageUrl !== null" class="flex items-center gap-2">
								<UInput v-model="imageUrl" type="url" class="min-w-0 flex-1" />
								<UButton variant="soft" color="neutral" @click="clearImage">Clear</UButton>
							</div>

							<div v-if="imageUrl === null && inputSource !== 'clipboard-image'" class="space-y-1">
								<label class="text-muted block text-[11px] font-medium uppercase tracking-wide">
									Upload from drive
								</label>
								<input
									ref="fileInputEl"
									type="file"
									accept="image/*"
									class="border-muted bg-muted/40 text-default file:border-0 file:bg-accented file:px-3 file:py-2 file:font-medium file:text-highlighted w-full rounded-lg border text-sm"
									:disabled="uploading"
									@change="onFileInputChange"
								>
							</div>
						</div>

						<p v-if="error !== null" class="text-red-400 text-sm">{{ error }}</p>

						<div class="flex justify-end gap-2">
							<UButton variant="soft" :disabled="uploading" @click="close"> Cancel </UButton>
							<UButton
								:disabled="
									uploading || (file === null && imageUrl === null) || selectedCollectionId === null
								"
								@click="submitUpload"
							>
								<template #leading>
									<Icon v-if="!uploading" name="i-lucide-upload" class="h-4 w-4" aria-hidden="true" />
									<Icon
										v-else
										name="i-lucide-loader-circle"
										class="h-4 w-4 animate-spin"
										aria-hidden="true"
									/>
								</template>
								{{ uploading ? 'Uploading…' : 'Upload' }}
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>

	<CreateCollectionOverlay
		v-model:open="createCollectionModal"
		:folders="collectionsData?.folders ?? []"
		:initial-folder-id="folderIdFromRoute"
		@created="onCollectionCreated"
	/>
</template>

<style scoped>
.imgupload-fade-enter-active,
.imgupload-fade-leave-active {
	transition: opacity 0.15s ease;
}

.imgupload-fade-enter-from,
.imgupload-fade-leave-to {
	opacity: 0;
}
</style>
