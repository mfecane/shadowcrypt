<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'
import type { CollectionFolderBlock, CollectionListItem, CollectionsListResponse } from '~/types/collections'
import { rankByFuzzyName } from '~~/lib/fuzzyMatchCollectionName'

interface QuickFindCollectionResult extends CollectionListItem {
	kind: 'collection'
}

interface QuickFindFolderResult {
	kind: 'folder'
	id: string
	name: string
	collectionCount: number
	previewImages: CollectionListItem['images']
}

type QuickFindResult = QuickFindCollectionResult | QuickFindFolderResult

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

function flattenFolders(res: CollectionsListResponse): QuickFindFolderResult[] {
	return res.folders.map((folder: CollectionFolderBlock) => ({
		kind: 'folder',
		id: folder.id,
		name: folder.name,
		collectionCount: folder.collections.length,
		previewImages: folder.collections.flatMap((collection) => collection.images).slice(0, 3),
	}))
}

const route = useRoute()
const router = useRouter()

const { open, closeOverlay: closeOverlayState, toggleOverlay } = useCollectionQuickFind()
const query = ref('')
const selectedIndex = ref(0)
const panelRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const isTargetRoute = computed(() => {
	const p = route.path
	return p === '/list' || /^\/list\/[^/]+$/.test(p) || /^\/collections\/[^/]+$/.test(p)
})

watch(isTargetRoute, (ok) => {
	if (!ok && open.value) {
		closeOverlayState()
	}
})

const { data, isPending } = useQuery({
	queryKey: ['collections'],
	queryFn: () => $fetch<CollectionsListResponse>('/api/collections'),
	enabled: computed(() => isTargetRoute.value),
})

const collections = computed<QuickFindCollectionResult[]>(() =>
	data.value !== undefined
		? flattenCollectionsDeduped(data.value).map((collection) => ({ ...collection, kind: 'collection' }))
		: []
)

const folders = computed<QuickFindFolderResult[]>(() => (data.value !== undefined ? flattenFolders(data.value) : []))

const ranked = computed<QuickFindResult[]>(() =>
	rankByFuzzyName<QuickFindResult>([...collections.value, ...folders.value], query.value)
)

watch([open, ranked], () => {
	selectedIndex.value = 0
})

watch(open, (v) => {
	if (import.meta.client) {
		document.body.style.overflow = v ? 'hidden' : ''
	}
	if (v) {
		query.value = ''
		nextTick(() => {
			panelRef.value?.querySelector?.('input')?.focus()
		})
	}
})

function close(): void {
	closeOverlayState()
}

function goToCollection(id: string): void {
	close()
	void router.push(`/collections/${id}`)
}

function goToFolder(id: string): void {
	close()
	void router.push(`/folder/${id}`)
}

function onSelectActive(): void {
	const list = ranked.value
	const item = list[selectedIndex.value]
	if (item !== undefined) {
		if (item.kind === 'folder') {
			goToFolder(item.id)
			return
		}
		goToCollection(item.id)
	}
}

function onGlobalKeydown(event: KeyboardEvent): void {
	if (!isTargetRoute.value) {
		return
	}
	const isPalette =
		(event.ctrlKey || event.metaKey) &&
		!event.altKey &&
		!event.shiftKey &&
		(event.code === 'KeyP' || event.key === 'p' || event.key === 'P')
	if (isPalette) {
		event.preventDefault()
		event.stopImmediatePropagation()
		event.stopPropagation()
		toggleOverlay()
		return
	}
	if (!open.value) {
		return
	}
	if (event.key === 'Escape') {
		event.preventDefault()
		event.stopPropagation()
		close()
		return
	}
	if (event.key === 'ArrowDown') {
		event.preventDefault()
		event.stopPropagation()
		const n = ranked.value.length
		if (n > 0) {
			selectedIndex.value = (selectedIndex.value + 1) % n
		}
		return
	}
	if (event.key === 'ArrowUp') {
		event.preventDefault()
		event.stopPropagation()
		const n = ranked.value.length
		if (n > 0) {
			selectedIndex.value = (selectedIndex.value - 1 + n) % n
		}
		return
	}
	if (event.key === 'Enter') {
		event.preventDefault()
		event.stopPropagation()
		onSelectActive()
	}
}

onMounted(() => {
	document.addEventListener('keydown', onGlobalKeydown, { capture: true })
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onGlobalKeydown, { capture: true })
	if (import.meta.client) {
		document.body.style.overflow = ''
	}
})

watch(selectedIndex, (i) => {
	nextTick(() => {
		const root = listRef.value
		if (root === null) {
			return
		}
		const row = root.querySelector(`[data-idx="${i}"]`)
		row?.scrollIntoView({ block: 'nearest' })
	})
})
</script>

<template>
	<Teleport to="body">
		<Transition name="quickfind-fade">
			<div
				v-if="open && isTargetRoute"
				class="fixed inset-0 z-200 flex items-center justify-center overflow-y-auto bg-black/55 p-2 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Find collection"
				@click.self="close"
			>
				<div
					ref="panelRef"
					class="border-muted bg-elevated text-default flex h-[90vh] max-h-[99vh] w-full max-w-[800px] min-h-0 flex-col rounded-xl border shadow-2xl"
					@click.stop
				>
					<div class="border-muted shrink-0 border-b px-4 py-3">
						<p class="text-muted mb-2 text-xs font-medium tracking-wide uppercase">Find collection</p>
						<UInput
							v-model="query"
							placeholder="Type to filter…"
							icon="i-lucide-search"
							size="md"
							class="w-full"
							:ui="{ base: 'w-full' }"
							autocomplete="off"
						/>
						<p class="text-muted mt-2 text-xs">Ctrl+P to toggle · ↑↓ navigate · Enter open · Esc close</p>
					</div>
					<div ref="listRef" class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
						<p v-if="isPending" class="text-muted px-3 py-6 text-sm">Loading…</p>
						<p v-else-if="ranked.length === 0" class="text-beige-400 px-3 py-6 text-sm">
							No matching collections or folders.
						</p>
						<ul v-else class="space-y-0.5">
							<li v-for="(item, idx) in ranked" :key="`${item.kind}-${item.id}`" :data-idx="idx">
								<button
									type="button"
									class="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
									:class="
										idx === selectedIndex
											? 'bg-accented text-highlighted'
											: 'hover:bg-accented/60 text-default'
									"
									@click="item.kind === 'folder' ? goToFolder(item.id) : goToCollection(item.id)"
								>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<Icon
												:name="item.kind === 'folder' ? 'i-lucide-folder' : 'i-lucide-layout-grid'"
												class="text-muted h-4 w-4 shrink-0"
											/>
											<div class="truncate font-medium">{{ item.name }}</div>
										</div>
										<div class="text-muted mt-0.5 text-xs tabular-nums">
											{{
												item.kind === 'folder'
													? `${item.collectionCount} collections`
													: `${item.imageCount} items`
											}}
										</div>
									</div>
									<div class="flex shrink-0 items-center gap-2">
										<template v-if="(item.kind === 'folder' ? item.previewImages : item.images).length">
											<img
												v-for="img in (item.kind === 'folder' ? item.previewImages : item.images).slice(0, 3)"
												:key="img.id"
												:src="img.url"
												class="border-muted bg-muted/60 h-[7.2rem] w-[7.2rem] rounded-sm border object-cover"
												alt=""
												@dragstart.prevent
											>
										</template>
										<template v-else>
											<div
												class="border-muted bg-muted/60 h-[7.2rem] w-[7.2rem] rounded-sm border"
											/>
											<div
												class="border-muted bg-muted/60 h-[7.2rem] w-[7.2rem] rounded-sm border"
											/>
											<div
												class="border-muted bg-muted/60 h-[7.2rem] w-[7.2rem] rounded-sm border"
											/>
										</template>
									</div>
								</button>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.quickfind-fade-enter-active,
.quickfind-fade-leave-active {
	transition: opacity 0.15s ease;
}

.quickfind-fade-enter-from,
.quickfind-fade-leave-to {
	opacity: 0;
}
</style>
