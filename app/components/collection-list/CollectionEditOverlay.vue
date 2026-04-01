<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

const target = useCollectionEditOverlayState()
const queryClient = useQueryClient()

const pinned = ref(false)
const archived = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

watch(
	() => target.value,
	(t) => {
		if (t !== null) {
			pinned.value = t.pinned
			archived.value = t.archived
			error.value = null
		}
	},
	{ immediate: true }
)

const open = computed(() => target.value !== null)

function close(): void {
	target.value = null
}

async function save(): Promise<void> {
	const t = target.value
	if (t === null) {
		return
	}
	saving.value = true
	error.value = null
	try {
		await $fetch(`/api/collections/${t.id}`, {
			method: 'PATCH',
			body: { pinned: pinned.value, archived: archived.value },
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['collection', t.id] })
		await queryClient.invalidateQueries({ queryKey: ['folder'] })
		close()
	} catch {
		error.value = 'Save failed'
	} finally {
		saving.value = false
	}
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

onMounted(() => {
	document.addEventListener('keydown', onGlobalKeydown, { capture: true })
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onGlobalKeydown, { capture: true })
})
</script>

<template>
	<Teleport to="body">
		<Transition name="coll-edit-fade">
			<div
				v-if="open"
				class="fixed inset-0 z-220 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Edit collection"
				@click.self="close"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-5 shadow-2xl"
					@click.stop
				>
					<p class="text-muted mb-4 text-xs font-medium tracking-wide uppercase">Edit collection</p>
					<label class="text-default mb-3 flex cursor-pointer items-center gap-2 text-sm">
						<input v-model="pinned" type="checkbox" class="accent-beige-500 rounded">
						Pinned
					</label>
					<label class="text-default mb-4 flex cursor-pointer items-center gap-2 text-sm">
						<input v-model="archived" type="checkbox" class="accent-beige-500 rounded">
						Archived
					</label>
					<p v-if="error !== null" class="text-red-400 mb-3 text-sm">{{ error }}</p>
					<div class="flex justify-end gap-2">
						<button
							type="button"
							class="text-muted hover:bg-muted/60 rounded-lg px-3 py-2 text-sm"
							:disabled="saving"
							@click="close"
						>
							Cancel
						</button>
						<button
							type="button"
							class="bg-beige-600 hover:bg-beige-500 disabled:bg-muted rounded-lg px-4 py-2 text-sm font-medium text-neutral-950 disabled:cursor-not-allowed"
							:disabled="saving"
							@click="save"
						>
							{{ saving ? 'Saving…' : 'Save' }}
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.coll-edit-fade-enter-active,
.coll-edit-fade-leave-active {
	transition: opacity 0.15s ease;
}

.coll-edit-fade-enter-from,
.coll-edit-fade-leave-to {
	opacity: 0;
}
</style>
