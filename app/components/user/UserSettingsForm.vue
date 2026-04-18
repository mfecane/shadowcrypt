<script setup lang="ts">
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const { user, fetch: fetchSession } = useUserSession()

const error = ref<string | null>(null)
const message = ref<string | null>(null)
const loading = ref(false)
const avatarUploading = ref(false)
const avatarDeleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const hasCustomAvatar = computed(() => user.value?.hasCustomAvatar === true)
const avatarDisplayUrl = useUserAvatarDisplayUrl()
const state = reactive({
	name: '',
})
const avatarBusy = computed(() => avatarUploading.value || avatarDeleting.value)

watch(
	() => user.value,
	(u) => {
		const nextName = typeof u?.name === 'string' ? u.name : ''
		state.name = nextName
	},
	{ immediate: true }
)

async function onSubmit(): Promise<void> {
	error.value = null
	message.value = null
	loading.value = true
	try {
		await $fetch('/api/user/me', { method: 'PATCH', body: { name: state.name } })
		await fetchSession()
		message.value = 'Profile updated.'
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Update failed')
	}
	loading.value = false
}

function openAvatarPicker(): void {
	fileInput.value?.click()
}

async function onAvatarFileChange(event: Event): Promise<void> {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	input.value = ''
	if (!file) {
		return
	}
	error.value = null
	message.value = null
	avatarUploading.value = true
	try {
		const body = new FormData()
		body.append('file', file)
		await $fetch('/api/user/avatar', { method: 'POST', body })
		await fetchSession()
		message.value = 'Profile picture updated.'
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Upload failed')
	} finally {
		avatarUploading.value = false
	}
}

async function deleteAvatar(): Promise<void> {
	error.value = null
	message.value = null
	avatarDeleting.value = true
	try {
		await $fetch('/api/user/avatar', { method: 'DELETE' })
		await fetchSession()
		message.value = 'Profile picture removed.'
	} catch (e: unknown) {
		error.value = fetchFormErrorMessage(e, 'Remove failed')
	} finally {
		avatarDeleting.value = false
	}
}
</script>

<template>
	<UForm :state="state" class="space-y-4" @submit.prevent="onSubmit">
		<UAlert v-if="error" color="error" variant="soft" :title="error" />

		<UAlert v-if="message" color="success" variant="soft" :title="message" />

		<UFormField
			label="Profile picture"
			help="Upload a square image for the cleanest crop."
		>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
				<UAvatar
					:src="avatarDisplayUrl || undefined"
					:alt="user?.name ?? user?.email ?? 'User avatar'"
					size="3xl"
					icon="i-lucide-user"
					class="ring ring-default"
				/>
				<div class="flex flex-col gap-2">
					<input
						ref="fileInput"
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
						class="hidden"
						@change="onAvatarFileChange"
					>
					<div class="flex flex-wrap gap-2">
						<UButton
							type="button"
							color="neutral"
							variant="outline"
							:loading="avatarUploading"
							:disabled="avatarBusy"
							@click="openAvatarPicker"
						>
							Change photo
						</UButton>
						<UButton
							v-if="hasCustomAvatar"
							type="button"
							color="neutral"
							variant="outline"
							:loading="avatarDeleting"
							:disabled="avatarBusy"
							@click="deleteAvatar"
						>
							Remove photo
						</UButton>
					</div>
				</div>
			</div>
		</UFormField>

		<UFormField label="E-mail" name="email">
			<UInput id="user-email" :model-value="user?.email ?? ''" type="email" readonly disabled class="w-full" />
		</UFormField>

		<UFormField label="Username" name="name">
			<UInput id="user-name" v-model="state.name" type="text" autocomplete="username" maxlength="128" class="w-full" />
		</UFormField>

		<UButton type="submit" color="neutral" variant="soft" :loading="loading" :disabled="loading">Update</UButton>
	</UForm>
</template>
