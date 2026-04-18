<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const name = defineModel<string>('name', { required: true })

defineProps<{ saving: boolean; error?: string | null }>()

const emit = defineEmits<{ save: [] }>()
</script>

<template>
	<UModal
		v-model:open="open"
		title="Edit collection"
		description="Rename the current collection."
		:close="!saving"
		:dismissible="!saving"
	>
		<template #body>
			<UForm :state="{ name }" id="collection-edit-form" class="space-y-4" @submit.prevent="emit('save')">
				<UFormField label="Collection name">
					<UInput id="collection-name-input" v-model="name" type="text" autocomplete="off" class="w-full" />
				</UFormField>
				<UAlert v-if="error" color="error" variant="soft" :title="error" />
			</UForm>
		</template>

		<template #footer>
			<div class="flex justify-between gap-2 w-full">
				<UButton variant="soft" color="neutral" :disabled="saving" @click="open = false">Cancel</UButton>
				<UButton
					type="submit"
					form="collection-edit-form"
					leading-icon="i-lucide-save"
					:loading="saving"
					:disabled="saving"
				>
					Save
				</UButton>
			</div>
		</template>
	</UModal>
</template>
