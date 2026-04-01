<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type {
	CollectionImageUploadResponse,
	CollectionListItem,
	CollectionsListResponse,
} from '~/types/collections'
import { MAX_COLLECTION_IMAGE_UPLOAD_BYTES } from '~~/lib/collectionImageUploadConstants'

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
	if (res.pinned.length > 0) {
		const options = res.pinned.map(take).filter((o): o is { id: string; name: string } => o !== null)
		if (options.length > 0) {
			groups.push({ label: 'Pinned', options })
		}
	}
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

function clipboardHasImage(cb: DataTransfer | null): boolean {
	if (cb === null) {
		return false
	}
	for (const item of cb.items) {
		if (item.kind === 'file' && item.type.startsWith('image/')) {
			return true
		}
	}
	return false
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

function fetchErrorMessage(e: unknown): string {
	if (e !== null && typeof e === 'object' && 'data' in e) {
		const d = (e as { data?: { statusMessage?: string; message?: string } }).data
		const m = d?.statusMessage ?? d?.message
		if (typeof m === 'string' && m.length > 0) {
			return m
		}
	}
	return 'Upload failed'
}

const route = useRoute()
const queryClient = useQueryClient()
const { open, openOverlay, closeOverlay: closeOverlayState } = useImageUploadOverlay()

const isTargetRoute = computed(() => {
	const p = route.path
	return p === '/list' || /^\/list\/[^/]+$/.test(p) || /^\/collections\/[^/]+$/.test(p)
})

const collectionIdFromRoute = computed(() => {
	const m = /^\/collections\/([^/]+)$/.exec(route.path)
	return m?.[1] ?? null
})
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const uploading = ref(false)
const selectedCollectionId = ref<string | null>(null)

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
		const first = flatCollections.value[0]
		selectedCollectionId.value = first !== undefined ? first.id : null
	},
	{ immediate: true }
)

watch(file, (f) => {
	if (previewUrl.value !== null) {
		URL.revokeObjectURL(previewUrl.value)
		previewUrl.value = null
	}
	if (f !== null) {
		previewUrl.value = URL.createObjectURL(f)
	}
})

function setFile(next: File | null): void {
	file.value = next
	error.value = null
}

function close(): void {
	closeOverlayState()
	setFile(null)
	uploading.value = false
	error.value = null
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
	if (!isTargetRoute.value || !dataTransferHasImage(e.dataTransfer)) {
		return
	}
	e.preventDefault()
	openFromClipboardOrDrag()
}

function onWindowDragOver(e: DragEvent): void {
	if (!isTargetRoute.value) {
		return
	}
	if (!dataTransferHasImage(e.dataTransfer)) {
		return
	}
	e.preventDefault()
}

function onPanelDrop(e: DragEvent): void {
	const f = firstImageFromDataTransfer(e.dataTransfer)
	if (f === null) {
		error.value = 'Drop an image file (PNG, JPEG, WebP, …)'
		return
	}
	setFile(f)
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
	if (!clipboardHasImage(e.clipboardData)) {
		return
	}
	e.preventDefault()
	const f = firstImageFromClipboard(e.clipboardData)
	if (f === null) {
		return
	}
	openFromClipboardOrDrag()
	setFile(f)
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

async function submitUpload(): Promise<void> {
	const cid = selectedCollectionId.value
	const f = file.value
	if (cid === null || f === null) {
		error.value = 'Choose a collection and an image.'
		return
	}
	if (f.size > MAX_COLLECTION_IMAGE_UPLOAD_BYTES) {
		error.value = `Image is too large (max ${Math.round(MAX_COLLECTION_IMAGE_UPLOAD_BYTES / (1024 * 1024))} MB).`
		return
	}
	uploading.value = true
	error.value = null
	const body = new FormData()
	body.append('file', f)
	try {
		await $fetch<CollectionImageUploadResponse>(`/api/collections/${cid}/images`, {
			method: 'POST',
			body,
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', cid] })
		close()
	} catch (e: unknown) {
		error.value = fetchErrorMessage(e)
	} finally {
		uploading.value = false
	}
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
		if (previewUrl.value !== null) {
			URL.revokeObjectURL(previewUrl.value)
		}
		window.removeEventListener('dragenter', onWindowDragEnter)
		window.removeEventListener('dragover', onWindowDragOver)
		document.removeEventListener('paste', onPaste)
		document.removeEventListener('keydown', onGlobalKeydown, { capture: true })
	}
})
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
							<p class="text-muted text-xs font-medium tracking-wide uppercase">Add image</p>
							<p class="text-muted mt-1 text-xs">Drop, paste, then pick a collection and upload.</p>
						</div>
						<button
							type="button"
							class="text-muted hover:text-default rounded-md px-2 py-1 text-lg leading-none transition-colors"
							aria-label="Close"
							@click="close"
						>
							×
						</button>
					</div>

					<div class="flex flex-col gap-4 px-4 py-4">
						<div>
							<label class="text-muted mb-1.5 block text-xs font-medium uppercase">Collection</label>
							<p v-if="collectionsPending" class="text-muted text-sm">Loading collections…</p>
							<p v-else-if="flatCollections.length === 0" class="text-beige-400 text-sm">
								No collections — create one first.
							</p>
							<select
								v-else
								v-model="selectedCollectionId"
								class="border-muted bg-muted/40 text-default focus:ring-beige-500/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
							>
								<template v-for="g in collectionGroups" :key="g.label">
									<optgroup :label="g.label">
										<option v-for="o in g.options" :key="o.id" :value="o.id">
											{{ o.name }}
										</option>
									</optgroup>
								</template>
							</select>
						</div>

						<div
							class="border-muted bg-muted/25 flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center"
						>
							<img
								v-if="previewUrl !== null"
								:src="previewUrl"
								alt=""
								class="max-h-48 max-w-full rounded-md object-contain"
							>
							<p v-else class="text-muted text-sm">Drop an image here or paste from clipboard (⌘V / Ctrl+V).</p>
						</div>

						<p v-if="error !== null" class="text-red-400 text-sm">{{ error }}</p>

						<div class="flex justify-end gap-2">
							<button
								type="button"
								class="text-muted hover:bg-muted/60 rounded-lg px-3 py-2 text-sm transition-colors"
								:disabled="uploading"
								@click="close"
							>
								Cancel
							</button>
							<button
								type="button"
								class="bg-beige-600 hover:bg-beige-500 disabled:bg-muted rounded-lg px-4 py-2 text-sm font-medium text-neutral-950 transition-colors disabled:cursor-not-allowed"
								:disabled="
									uploading ||
									file === null ||
									selectedCollectionId === null ||
									flatCollections.length === 0
								"
								@click="submitUpload"
							>
								{{ uploading ? 'Uploading…' : 'Upload' }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
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
