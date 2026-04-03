<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

const target = useFolderEditOverlayState()
const queryClient = useQueryClient()

const name = ref('')
const archived = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

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

function deleteFolder(): void {
	throw new Error('Not implemented')
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
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-5 shadow-2xl flex flex-col gap-4"
					@click.stop
				>
					<p class="text-muted text-xs font-medium tracking-wide uppercase">Edit folder</p>
					<label class="text-muted text-xs font-medium uppercase" for="folder-name-input">Name</label>
					<UInput id="folder-name-input" v-model="name" type="text" autocomplete="off" class="self-stretch" />
					<USwitch v-model="archived" :label="archived ? 'Archived' : 'Unarchived'" />
					<p v-if="error !== null" class="text-red-400 text-sm">{{ error }}</p>
					<div class="flex justify-end gap-2">
						<UButton color="error" size="sm" icon="i-lucide-trash" @click="deleteFolder">
							<template #icon>
								<Icon v-if="deleting" name="i-lucide-loader-circle" class="h-4 w-4" />
								<Icon v-if="deleting" name="i-lucide-trash" class="h-4 w-4" />
							</template>
							{{ deleting ? 'Deleting…' : 'Delete' }}
						</UButton>
						<div class="flex justify-end gap-2">
							<UButton variant="soft" size="sm" :disabled="saving" @click="close"> Cancel </UButton>
							<UButton type="button" :disabled="saving" @click="save">
								<template #icon>
									<Icon v-if="saving" name="i-lucide-loader-circle" class="h-4 w-4" />
									<Icon v-if="saving" name="i-lucide-save" class="h-4 w-4" />
								</template>
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
.folder-edit-fade-enter-active,
.folder-edit-fade-leave-active {
	transition: opacity 0.15s ease;
}

.folder-edit-fade-enter-from,
.folder-edit-fade-leave-to {
	opacity: 0;
}
</style>
