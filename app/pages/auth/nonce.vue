<script setup lang="ts">
definePageMeta({
	layout: 'auth',
	auth: {
		unauthenticatedOnly: true,
		navigateAuthenticatedTo: '/list',
	},
})

const route = useRoute()
const router = useRouter()

const email = computed(() => {
	const e = route.query.email
	return typeof e === 'string' && e.length > 0 ? e : null
})

onMounted(() => {
	if (email.value === null) {
		void router.replace('/auth/gate')
	}
})

const code = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const resendLoading = ref(false)
const resendCooldownSeconds = ref(0)
const message = ref<string | null>(null)

const canSubmit = computed(() => code.value.trim().length === 6)

const { fetch: fetchSession } = useUserSession()

let cooldownTimer: ReturnType<typeof setInterval> | undefined

onUnmounted(() => {
	if (cooldownTimer !== undefined) {
		clearInterval(cooldownTimer)
	}
})

/** Convenience shortcut: bump when a new silent attempt starts so stale responses are ignored. */
let silentSignInGeneration = 0

async function signInWithNonceCode(
	codeParam: string,
	options?: { validateBeforeNavigate?: () => boolean }
): Promise<boolean> {
	const result = await $fetch<{ ok: boolean }>('/api/auth/email-nonce', {
		method: 'POST',
		body: { email: email.value ?? '', code: codeParam },
	}).catch(() => null)
	if (result === null || result.ok !== true) {
		return false
	}
	if (options?.validateBeforeNavigate?.() === false) {
		return false
	}
	await fetchSession()
	await navigateTo('/list')
	return true
}

async function signInWithNonce(): Promise<boolean> {
	return signInWithNonceCode(code.value)
}

watch(code, (newVal, oldVal) => {
	const cleaned = newVal.replace(/\D/g, '')
	const prev = (oldVal ?? '').replace(/\D/g, '')
	if (cleaned.length !== 6 || prev.length >= 6 || email.value === null) {
		return
	}
	const snapshot = cleaned
	const gen = ++silentSignInGeneration
	void (async (): Promise<void> => {
		try {
			await signInWithNonceCode(snapshot, {
				validateBeforeNavigate: () =>
					gen === silentSignInGeneration && code.value.replace(/\D/g, '') === snapshot,
			})
		} catch {
			// Silent shortcut: never surface errors.
		}
	})()
})

async function onSubmit(): Promise<void> {
	loading.value = true
	error.value = null
	message.value = null
	const ok = await signInWithNonce()
	if (ok) {
		message.value = 'Code verified. Continuing...'
	} else {
		error.value = 'The code is invalid or expired.'
	}
	loading.value = false
}

async function handleResendCode(): Promise<void> {
	resendLoading.value = true
	error.value = null
	message.value = null
	const response = await $fetch('/api/auth/email/request', {
		method: 'POST',
		body: { email: email.value ?? '' },
	}).catch(() => null)
	resendLoading.value = false
	if (response === null) {
		error.value = 'Failed to resend code. Please try again.'
		return
	}
	message.value = 'A new verification code has been sent.'
	if (cooldownTimer !== undefined) {
		clearInterval(cooldownTimer)
	}
	resendCooldownSeconds.value = 30
	cooldownTimer = setInterval(() => {
		resendCooldownSeconds.value -= 1
		if (resendCooldownSeconds.value <= 0 && cooldownTimer !== undefined) {
			clearInterval(cooldownTimer)
			cooldownTimer = undefined
		}
	}, 1000)
}

function goBack(): void {
	if (import.meta.client && window.history.length > 1) {
		window.history.back()
		return
	}
	void navigateTo('/auth/gate')
}
</script>

<template>
	<UCard v-if="email">
		<template #header>
			<AuthBrandHeader>
				<h2 class="mb-2 text-lg font-medium text-muted">Check your email</h2>
				<p class="text-muted text-sm">Verification code has been sent to {{ email }}</p>
			</AuthBrandHeader>
		</template>
		<form class="flex flex-col gap-4" @submit.prevent="onSubmit">
			<div class="flex flex-col gap-6 items-stretch">
				<OtpDigitsInput id="nonce-code" v-model="code" />
				<UButton type="submit" block :loading="loading" :disabled="!canSubmit || loading">
					{{ loading ? 'Verifying...' : 'Verify code' }}
				</UButton>
				<UButton
					type="button"
					variant="soft"
					color="neutral"
					block
					:loading="resendLoading"
					:disabled="resendLoading || loading || resendCooldownSeconds > 0"
					@click="handleResendCode"
				>
					{{
						resendLoading
							? 'Sending code...'
							: resendCooldownSeconds > 0
								? `Send code again in ${resendCooldownSeconds}s`
								: 'Send code again'
					}}
				</UButton>
				<p v-if="message" class="text-muted-foreground text-sm">{{ message }}</p>
				<p v-if="error" class="text-error text-sm">{{ error }}</p>
				<UButton variant="soft" color="neutral" block leading-icon="i-lucide-arrow-left" @click="goBack">
					Go back
				</UButton>
			</div>
		</form>
	</UCard>
</template>
