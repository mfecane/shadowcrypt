<script setup lang="ts">
import CollectionsSelector from '~/components/CollectionsSelector.vue'

const open = defineModel<boolean>('open', { required: true })
const targetCollectionId = defineModel<string | null>('targetCollectionId', { required: true })

defineProps<{
	groups: { label: string; options: { id: string; name: string }[] }[]
	collectionsPending: boolean
	hasAnotherCollection: boolean
	moving: boolean
	error: string | null
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
			@click.self="open = false"
		>
			<div class="bg-elevated border-muted w-full max-w-md rounded-lg border p-6 shadow-xl">
				<h2 class="text-highlighted mb-4 text-lg font-semibold">Move image to collection</h2>
				<p v-if="collectionsPending" class="text-muted mb-4 text-sm">Loading collections…</p>
				<p v-else-if="!hasAnotherCollection" class="text-muted mb-4 text-sm">
					Create another collection first, then you can move images there.
				</p>
				<div v-else class="mb-4">
					<CollectionsSelector
						v-model="targetCollectionId"
						:groups="groups"
						placeholder="Choose collection"
					/>
				</div>
				<p v-if="error !== null" class="text-red-400 mb-4 text-sm">{{ error }}</p>
				<div class="flex justify-end gap-2">
					<UButton variant="ghost" class="text-muted hover:text-highlighted" @click="open = false">
						Cancel
					</UButton>
					<UButton
						variant="solid"
						class="bg-primary text-inverted"
						:icon="moving ? 'i-lucide-loader-circle' : 'i-lucide-move'"
						:loading="moving"
						:disabled="moving || targetCollectionId === null"
						@click="emit('confirm')"
					>
						Move
					</UButton>
				</div>
			</div>
		</div>
	</Teleport>
</template>
