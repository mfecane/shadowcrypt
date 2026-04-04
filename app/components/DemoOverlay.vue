<script setup lang="ts">
const config = useRuntimeConfig()
const { fetch: fetchSession, loggedIn, ready } = useUserSession()

const visible = ref(true)

const showOverlay = computed(() => {
	return config.public.demo && visible.value && ready.value && !loggedIn.value
})

async function signInAsDemoUser(): Promise<void> {
	await $fetch<{ ok: true }>('/api/auth/demo', { method: 'POST' })
	await fetchSession()
	visible.value = false
	await navigateTo('/list')
}

function dismissDemoOverlay(): void {
	visible.value = false
	sessionStorage.setItem('demo-overlay-dismissed', 'true')
}

onMounted(() => {
	if (sessionStorage.getItem('demo-overlay-dismissed') === 'true') {
		visible.value = false
	}
})
</script>

<template>
	<Teleport v-if="showOverlay" to="body">
		<div
			class="fixed bottom-8 right-1/2 translate-x-1/2 bg-neutral-950/50 z-50 backdrop-blur-[5px] p-4 rounded-md flex flex-col gap-4 max-w-md border border-neutral-800"
		>
			<p class="text-muted">
				This is a demo mode. You can use the app as a guest, but you will not be able to save your changes.
			</p>
			<div class="flex items-center gap-2 mx-auto">
				<UButton
					class="self-start inline-flex items-center gap-2"
					icon="i-lucide-user"
					@click="signInAsDemoUser"
				>
					Sign in as demo user
				</UButton>
				<UButton
					color="secondary"
					class="self-start inline-flex items-center gap-2"
					icon="i-lucide-x"
					@click="dismissDemoOverlay"
				>
					Dismiss
				</UButton>
			</div>
		</div>
	</Teleport>
</template>
