<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

const target = useFolderEditOverlayState()
const queryClient = useQueryClient()

const name = ref('')
const archived = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

watch(
	() => target.value,
	(t) => {
		if (t !== null) {
			name.value = t.name
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
	const n = name.value.trim()
	if (n.length === 0) {
		error.value = 'Name is required'
		return
	}
	saving.value = true
	error.value = null
	try {
		await $fetch(`/api/folders/${t.id}`, {
			method: 'PATCH',
			body: { name: n, archived: archived.value },
		})
		await queryClient.invalidateQueries({ queryKey: ['collections'] })
		await queryClient.invalidateQueries({ queryKey: ['folder', t.id] })
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
		<Transition name="folder-edit-fade">
			<div
				v-if="open"
				class="fixed inset-0 z-220 flex items-center justify-center bg-black/60 p-3 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Edit folder"
				@click.self="close"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-5 shadow-2xl"
					@click.stop
				>
					<p class="text-muted mb-4 text-xs font-medium tracking-wide uppercase">Edit folder</p>
					<label class="text-muted mb-1.5 block text-xs font-medium uppercase">Name</label>
					<input
						v-model="name"
						type="text"
						class="border-muted bg-muted/40 text-default mb-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-beige-500/40"
						autocomplete="off"
					>
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
.folder-edit-fade-enter-active,
.folder-edit-fade-leave-active {
	transition: opacity 0.15s ease;
}

.folder-edit-fade-enter-from,
.folder-edit-fade-leave-to {
	opacity: 0;
}
</style>
