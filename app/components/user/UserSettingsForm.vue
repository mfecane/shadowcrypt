<script setup lang="ts">
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage'

const { user, fetch: fetchSession } = useUserSession()

const name = ref('')
const error = ref<string | null>(null)
const message = ref<string | null>(null)
const loading = ref(false)
const avatarUploading = ref(false)
const avatarDeleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const hasCustomAvatar = computed(() => user.value?.hasCustomAvatar === true)

const avatarDisplayUrl = useUserAvatarDisplayUrl()

watch(
	() => user.value,
	(u) => {
		name.value = typeof u?.name === 'string' ? u.name : ''
	},
	{ immediate: true }
)

async function onSubmit(): Promise<void> {
	error.value = null
	message.value = null
	loading.value = true
	try {
		await $fetch('/api/user/me', { method: 'PATCH', body: { name: name.value } })
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
	<form class="flex flex-col gap-4" @submit.prevent="onSubmit">
		<UAlert v-if="error" color="error" variant="soft" :title="error" />

		<UAlert v-if="message" color="success" variant="soft" :title="message" />

		<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
			<img
				v-if="avatarDisplayUrl"
				:src="avatarDisplayUrl"
				alt=""
				class="border-default size-20 shrink-0 rounded-full border object-cover"
			>
			<div
				v-else
				class="border-default bg-muted text-muted flex size-20 shrink-0 items-center justify-center rounded-full border text-xs"
			>
				No photo
			</div>
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
						:disabled="avatarUploading || avatarDeleting"
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
						:disabled="avatarUploading || avatarDeleting"
						@click="deleteAvatar"
					>
						Remove photo
					</UButton>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<label class="text-muted-foreground text-sm font-medium" for="user-email">E-mail</label>
				<UInput id="user-email" :model-value="user?.email ?? ''" type="email" readonly disabled />
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<label class="text-muted-foreground text-sm font-medium" for="user-name">Username</label>
			<UInput id="user-name" v-model="name" type="text" autocomplete="username" maxlength="128" />
		</div>

		<UButton type="submit" color="neutral" variant="soft" :loading="loading" :disabled="loading">Update</UButton>
	</form>
</template>
