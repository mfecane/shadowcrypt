<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCollectionViewerStore } from '~/stores/useCollectionViewerStore'

const DRAG_CURSOR_STYLE_ID = 'board-image-drag-out-cursor-style'
const DRAG_CURSOR_VALID_CLASS = 'board-image-drag-out--valid'
const DRAG_CURSOR_INVALID_CLASS = 'board-image-drag-out--invalid'

/** Forces the grab/no-drop cursor over every element (buttons etc. set their own otherwise). */
function ensureDragCursorStyleInjected(): void {
	if (document.getElementById(DRAG_CURSOR_STYLE_ID) !== null) {
		return
	}
	const style = document.createElement('style')
	style.id = DRAG_CURSOR_STYLE_ID
	style.textContent = `
		body.${DRAG_CURSOR_VALID_CLASS}, body.${DRAG_CURSOR_VALID_CLASS} * { cursor: grabbing !important; }
		body.${DRAG_CURSOR_INVALID_CLASS}, body.${DRAG_CURSOR_INVALID_CLASS} * { cursor: no-drop !important; }
	`
	document.head.appendChild(style)
}

function setDragCursor(dropAllowed: boolean | null): void {
	document.body.classList.remove(DRAG_CURSOR_VALID_CLASS, DRAG_CURSOR_INVALID_CLASS)
	if (dropAllowed === null) {
		return
	}
	ensureDragCursorStyleInjected()
	document.body.classList.add(dropAllowed ? DRAG_CURSOR_VALID_CLASS : DRAG_CURSOR_INVALID_CLASS)
}

const { dragOut } = storeToRefs(useCollectionViewerStore())

watch(dragOut, (d) => {
	setDragCursor(d === null ? null : d.dropAllowed)
})

onBeforeUnmount(() => {
	setDragCursor(null)
})

const style = computed(() => {
	const d = dragOut.value
	if (!d) return {}
	return {
		left: `${d.x}px`,
		top: `${d.y}px`,
		width: `${d.width}px`,
		height: `${d.height}px`,
	}
})
</script>

<template>
	<Teleport to="body">
		<div
v-if="dragOut" data-id="collection-image-drag-ghost"
			class="pointer-events-none fixed z-100 rounded-sm transition-[opacity] duration-100"
			:class="[dragOut.dropAllowed ? 'ring-2 ring-primary' : 'ring-1 ring-white/40', dragOut.pending ? 'opacity-60' : '']"
			:style="[style, { boxShadow: '0 12px 32px -8px rgba(0,0,0,0.55)', transform: 'rotate(-3deg) scale(1.03)' }]">
			<img :src="dragOut.thumbnailUrl" class="h-full w-full rounded-sm object-cover" alt="" draggable="false" />
			<div
v-if="dragOut.pending"
				class="absolute inset-0 flex items-center justify-center rounded-sm bg-black/30">
				<Icon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-white" />
			</div>
		</div>
	</Teleport>
</template>
