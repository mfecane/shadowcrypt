<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })

defineProps<{
	deleting: boolean
	error: string | null
}>()

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
	<UModal v-model:open="open" title="Delete image?" :close="!deleting" :dismissible="!deleting">
		<template #body>
			<div class="space-y-4">
				<p class="text-muted text-sm">This cannot be undone.</p>
				<p v-if="error !== null" class="text-error text-sm">{{ error }}</p>
			</div>
		</template>

		<template #footer>
			<UButton variant="soft" color="neutral" :disabled="deleting" @click="open = false">Cancel</UButton>
			<UButton
				color="error"
				leading-icon="i-lucide-trash"
				:loading="deleting"
				:disabled="deleting"
				@click="emit('confirm')"
			>
				Delete
			</UButton>
		</template>
	</UModal>
</template>
