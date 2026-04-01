<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const name = defineModel<string>('name', { required: true })

defineProps<{ saving: boolean }>()

const emit = defineEmits<{ save: [] }>()
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4"
			@click.self="open = false"
		>
			<div class="bg-elevated border-muted w-full max-w-md rounded-lg border p-6 shadow-xl">
				<h2 class="text-highlighted mb-4 text-lg font-semibold">Edit collection</h2>
				<label class="text-muted mb-1 block text-sm" for="collection-name-input">Collection name</label>
				<input
					id="collection-name-input"
					v-model="name"
					type="text"
					class="border-muted bg-muted mb-6 w-full rounded border px-3 py-2 text-highlighted"
					@keydown.enter="emit('save')"
				>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="text-muted hover:text-highlighted rounded px-4 py-2 text-sm"
						@click="open = false"
					>
						Cancel
					</button>
					<button
						type="button"
						class="bg-primary text-inverted rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
						:disabled="saving"
						@click="emit('save')"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

