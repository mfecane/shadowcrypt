<script setup lang="ts">
interface MoveGroup {
	label: string
	options: { id: string; name: string }[]
}

const open = defineModel<boolean>('open', { required: true })
const targetCollectionId = defineModel<string | null>('targetCollectionId', { required: true })

const props = defineProps<{
	groups: MoveGroup[]
	collectionsPending: boolean
	hasAnotherCollection: boolean
	moving: boolean
	error: string | null
}>()

const emit = defineEmits<{ confirm: [] }>()

function moveToCollection(id: string): void {
	if (props.moving) {
		return
	}
	targetCollectionId.value = id
	open.value = false
	emit('confirm')
}
</script>

<template>
	<UModal v-model:open="open" title="Move image to board" :close="!moving" :dismissible="!moving">
		<template #body>
			<div class="space-y-4">
				<p v-if="collectionsPending" class="text-muted text-sm">Loading collections…</p>
				<p v-else-if="!hasAnotherCollection" class="text-muted text-sm">
					Create another collection first, then you can move images there.
				</p>
				<div v-else class="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
					<section v-for="group in groups" :key="group.label" class="space-y-3">
						<div class="text-dimmed flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em]">
							<Icon
								:name="group.label === 'Without folder' ? 'i-lucide-folder-open' : 'i-lucide-folder'"
								class="h-4 w-4"
							/>
							<span>{{ group.label }}</span>
						</div>

						<div class="flex flex-col gap-2">
							<div
								v-for="option in group.options"
								:key="option.id"
								class="border-muted bg-muted/50 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
							>
								<p class="min-w-0 truncate text-sm font-medium text-highlighted">{{ option.name }}</p>
								<UButton
									size="sm"
									leading-icon="i-lucide-move-right"
									:loading="moving"
									:disabled="moving"
									@click="moveToCollection(option.id)"
								>
									Move
								</UButton>
							</div>
						</div>
					</section>
				</div>
				<p v-if="error !== null" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<UButton variant="soft" color="neutral" :disabled="moving" @click="open = false">Cancel</UButton>
		</template>
	</UModal>
</template>
