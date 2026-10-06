<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true })
const sourceUrl = defineModel<string>('sourceUrl', { required: true })

defineProps<{ saving: boolean; error?: string | null }>()

const emit = defineEmits<{ save: [] }>()
</script>

<template>
	<UModal
		v-model:open="open"
		title="Edit image"
		description="Attach a reference URL to this image. Only visible here."
		:close="!saving"
		:dismissible="!saving"
	>
		<template #body>
			<UForm :state="{ sourceUrl }" id="image-edit-form" class="space-y-4" @submit.prevent="emit('save')">
				<UFormField label="URL">
					<UFieldGroup class="w-full">
						<UInput
							id="image-source-url-input"
							v-model="sourceUrl"
							type="url"
							autocomplete="off"
							placeholder="https://…"
							class="flex-1"
						/>
						<UButton
							v-if="sourceUrl.trim()"
							color="neutral"
							variant="subtle"
							icon="i-lucide-external-link"
							aria-label="Open URL in new window"
							:to="sourceUrl.trim()"
							target="_blank"
							rel="noopener noreferrer"
						/>
					</UFieldGroup>
				</UFormField>
				<UAlert v-if="error" color="error" variant="soft" :title="error" />
			</UForm>
		</template>

		<template #footer>
			<div class="flex justify-between gap-2 w-full">
				<UButton variant="soft" color="neutral" :disabled="saving" @click="open = false">Cancel</UButton>
				<UButton
					type="submit"
					form="image-edit-form"
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
