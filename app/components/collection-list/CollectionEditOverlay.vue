<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

const target = useCollectionEditOverlayState()
const queryClient = useQueryClient()

const pinned = ref(false)
const name = ref('')
const archived = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

watch(
	() => target.value,
	(t) => {
		if (t !== null) {
			name.value = t.name
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
	const n = name.value.trim()
	if (n.length === 0) {
		error.value = 'Name is required'
		return
	}
	saving.value = true
	error.value = null
	try {
		await $fetch(`/api/collections/${t.id}`, {
			method: 'PATCH',
			body: { name: name.value, pinned: pinned.value, archived: archived.value },
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

async function deleteCollection(): Promise<void> {
	throw new Error('Not implemented')
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
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-5 shadow-2xl flex flex-col gap-4"
					@click.stop
				>
					<p class="text-muted text-sm font-medium tracking-wide uppercase">Edit collection</p>

					<UInput v-model="name" type="text" autocomplete="off" class="self-stretch" />

					<USwitch v-model="pinned" :label="pinned ? 'Pinned' : 'Unpinned'" />

					<USwitch v-model="archived" :label="archived ? 'Archived' : 'Unarchived'" />

					<p v-if="error !== null" class="text-red-400 mb-3 text-sm">{{ error }}</p>

					<div class="flex justify-between gap-2">
						<UButton color="error" size="sm" icon="i-lucide-trash" @click="deleteCollection">
							Delete
						</UButton>
						<div class="flex justify-end gap-2">
							<UButton variant="soft" :disabled="saving" @click="close"> Cancel </UButton>
							<UButton icon="i-lucide-save" :disabled="saving" @click="save">
								{{ saving ? 'Saving…' : 'Save' }}
							</UButton>
						</div>
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
