<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { CollectionBoardSummary } from '~/types/boards';

const props = defineProps<{
	board: CollectionBoardSummary
	active: boolean
	renaming: boolean
	renameError: string | null
	renameSaving: boolean
	deleteConfirming: boolean
	deleteError: string | null
	deleting: boolean
	deleteDisabled: boolean
	/** Drop-target state for a drag-out-of-canvas image currently hovering this card. */
	dropHover?: 'none' | 'valid' | 'pending'
}>()

const renameValue = defineModel<string>('renameValue', { required: true })

const emit = defineEmits<{
	select: []
	'rename-start': []
	'rename-cancel': []
	'rename-save': []
	'delete-ask': []
	'delete-cancel': []
	'delete-confirm': []
}>()

const mosaicImages = computed(() => props.board.previewImages.map((img) => ({ id: img.url, url: img.url })))

const dropHoverClass = computed(() => {
	switch (props.dropHover) {
		case 'valid':
			return 'ring-2 ring-primary scale-[1.03]'
		case 'pending':
			return 'ring-2 ring-primary opacity-70'
		default:
			return ''
	}
})

const menuItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: 'Rename',
			icon: 'i-heroicons-pencil-square',
			onSelect: () => emit('rename-start'),
		},
		{
			label: 'Delete',
			icon: 'i-lucide-trash',
			color: 'error',
			disabled: props.deleteDisabled,
			onSelect: () => emit('delete-ask'),
		},
	],
])
</script>

<template>
	<div
data-id="board-card" data-board-drop-target :data-board-id="board.id"
		class="border-muted bg-elevated flex h-[220px] min-h-0 flex-col overflow-hidden rounded-md border relative shadow-[2px_2px_8px_0_rgba(0,0,0,0.3)] transition-[transform,box-shadow] duration-150"
		:class="[active ? 'ring-1 ring-primary' : '', dropHoverClass]">
		<div v-if="renaming" data-id="board-card-rename" class="flex h-full flex-col justify-center gap-1 p-2">
			<UInput
v-model="renameValue" size="xs" autofocus @keydown.enter="$emit('rename-save')"
				@keydown.escape="$emit('rename-cancel')" />
			<p v-if="renameError" class="text-xs text-error">{{ renameError }}</p>
			<div class="flex justify-end gap-1">
				<UButton size="xs" color="neutral" variant="ghost" @click="$emit('rename-cancel')">Cancel</UButton>
				<UButton size="xs" :loading="renameSaving" @click="$emit('rename-save')">Save</UButton>
			</div>
		</div>

		<div
v-else-if="deleteConfirming" data-id="board-card-delete-confirm"
			class="flex h-full flex-col justify-center gap-1 p-2">
			<p class="text-xs text-toned">Delete "{{ board.name }}"?</p>
			<p v-if="deleteError" class="text-xs text-error">{{ deleteError }}</p>
			<div class="flex justify-end gap-1">
				<UButton size="xs" color="neutral" variant="ghost" @click="$emit('delete-cancel')">Cancel</UButton>
				<UButton size="xs" color="error" :loading="deleting" @click="$emit('delete-confirm')">Delete</UButton>
			</div>
		</div>

		<div v-else data-id="board-card-tile" class="relative h-full min-h-0 cursor-pointer" @click="$emit('select')">
			<ImageMosaicGrid :images="mosaicImages" size="smol" class="absolute inset-0 h-full w-full" />

			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />

			<div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-2">
				<div class="min-w-0">
					<div class="truncate text-base font-medium text-white drop-shadow">
						{{ board.name }}
					</div>
					<div class="text-xs font-medium text-white/80 drop-shadow">{{ board.imageCount }} items</div>
				</div>
				<UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
					<UButton
icon="i-lucide-ellipsis-vertical" variant="ghost" color="neutral" size="xs" square
						class="shrink-0" @click.stop />
				</UDropdownMenu>
			</div>
		</div>
	</div>
</template>
