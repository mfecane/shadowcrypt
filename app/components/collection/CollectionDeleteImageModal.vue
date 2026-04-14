<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

defineProps<{
	deleting: boolean
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
				<h2 class="text-highlighted mb-4 text-lg font-semibold">Delete image?</h2>
				<p class="text-muted mb-4 text-sm">This cannot be undone.</p>
				<p v-if="error !== null" class="text-red-400 mb-4 text-sm">{{ error }}</p>
				<div class="flex justify-end gap-2">
					<UButton variant="ghost" class="text-muted hover:text-highlighted" @click="open = false">
						Cancel
					</UButton>
					<UButton
						variant="solid"
						:icon="deleting ? 'i-lucide-loader-circle' : 'i-lucide-trash'"
						:loading="deleting"
						:disabled="deleting"
						color="error"
						@click="emit('confirm')"
					>
						Delete
					</UButton>
				</div>
			</div>
		</div>
	</Teleport>
</template>
