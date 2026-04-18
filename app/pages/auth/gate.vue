<script setup lang="ts">
definePageMeta({
	layout: 'auth',
	auth: {
		unauthenticatedOnly: true,
		navigateAuthenticatedTo: '/list',
	},
})

const route = useRoute()
const authError = computed(() => {
	const e = route.query.error
	return typeof e === 'string' ? e : null
})

const GOOGLE_AUTH_ERROR_MESSAGES: Record<string, string> = {
	OAuthSignin: 'Google sign-in could not be started. Please try again.',
	OAuthCallback: 'Google sign-in did not complete. Please try again.',
	OAuthCreateAccount: 'Your account could not be created from Google sign-in.',
	EmailCreateAccount: 'Your account could not be created. Please try again.',
	Callback: 'The sign-in callback failed. Please try again.',
	AccessDenied: 'Google sign-in was denied. Please allow access to continue.',
	OAuthAccountNotLinked: 'This email is already linked to another sign-in method.',
	Default: 'Google sign-in failed. Please try again.',
}

const authErrorMessage = computed(() => {
	if (authError.value === null) {
		return null
	}
	return GOOGLE_AUTH_ERROR_MESSAGES[authError.value] ?? GOOGLE_AUTH_ERROR_MESSAGES.Default
})

function googleSignIn(): void {
	const callbackUrl = (route.query.callbackUrl as string) || '/list'
	window.location.href = `/auth/google?state=${encodeURIComponent(callbackUrl)}`
}

const email = ref('')
const isSubmittingEmail = ref(false)
const emailRequestError = ref<string | null>(null)

async function onEmailSubmit(): Promise<void> {
	isSubmittingEmail.value = true
	emailRequestError.value = null
	const response = await $fetch<{ success: boolean }>('/api/auth/email/request', {
		method: 'POST',
		body: { email: email.value },
	}).catch(() => null)
	isSubmittingEmail.value = false
	if (response === null) {
		emailRequestError.value = 'Unable to send sign-in code right now. Please try again.'
		return
	}
	await navigateTo({ path: '/auth/nonce', query: { email: email.value } })
}
</script>

<template>
	<UCard>
		<template #header>
			<AuthBrandHeader>
				<p class="text-muted">Sign in to your account</p>
			</AuthBrandHeader>
		</template>
		<div class="flex flex-col gap-4">
			<UButton variant="soft" block size="xl" @click="googleSignIn">
				<IconsGoogleIcon class="size-5 shrink-0" />
				Continue with Google
			</UButton>
			<p v-if="authErrorMessage" class="text-error text-sm">{{ authErrorMessage }}</p>
			<UButton variant="soft" block size="xl" disabled class="flex-col gap-0.5">
				<span class="flex items-center gap-2">
					<IconsAppleIcon class="size-5 shrink-0" />
					Continue with Apple
				</span>
				<span class="text-muted-foreground text-xs leading-none">Coming soon...</span>
			</UButton>
			<hr class="border-muted">
			<p class="text-muted-foreground text-center text-sm">or continue with email</p>
			<form class="flex flex-col gap-6 items-stretch" @submit.prevent="onEmailSubmit">
				<UInput id="email" v-model="email" type="email" placeholder="Email" required class="w-full" />
				<UButton type="submit" variant="soft" block :loading="isSubmittingEmail" :disabled="isSubmittingEmail">
					{{ isSubmittingEmail ? 'Sending code...' : 'Continue' }}
				</UButton>
				<p v-if="emailRequestError" class="text-error text-sm">{{ emailRequestError }}</p>
			</form>
		</div>
	</UCard>
</template>
