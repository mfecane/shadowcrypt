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
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
			@click.self="open = false"
		>
			<div class="bg-elevated border-muted w-full max-w-2xl rounded-lg border p-6 shadow-xl">
				<h2 class="text-highlighted mb-4 text-lg font-semibold">Move image to board</h2>
				<p v-if="collectionsPending" class="text-muted mb-4 text-sm">Loading collections…</p>
				<p v-else-if="!hasAnotherCollection" class="text-muted mb-4 text-sm">
					Create another collection first, then you can move images there.
				</p>
				<div v-else class="mb-4 max-h-[70vh] space-y-6 overflow-y-auto pr-1">
					<section v-for="group in groups" :key="group.label" class="space-y-3">
						<div
							class="text-dimmed flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em]"
						>
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
								<div class="min-w-0">
									<p class="text-highlighted truncate text-sm font-medium">{{ option.name }}</p>
								</div>
								<UButton
									variant="solid"
									size="sm"
									class="bg-primary text-inverted shrink-0"
									:icon="moving ? 'i-lucide-loader-circle' : 'i-lucide-move-right'"
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
				<p v-if="error !== null" class="text-red-400 mb-4 text-sm">{{ error }}</p>
				<div class="flex justify-end">
					<UButton variant="ghost" class="text-muted hover:text-highlighted" @click="open = false">
						Cancel
					</UButton>
				</div>
			</div>
		</div>
	</Teleport>
</template>
