<script setup lang="ts">
const config = useRuntimeConfig()
const { fetch: fetchSession, loggedIn, ready } = useUserSession()

const visible = ref(true)

const showDemoModal = computed(() => {
	return config.public.demo && visible.value && ready.value && !loggedIn.value
})

async function signInAsDemoUser(): Promise<void> {
	await $fetch<{ ok: true }>('/api/auth/demo', { method: 'POST' })
	await fetchSession()
	visible.value = false
	await navigateTo('/list')
}

function dismissDemoModal(): void {
	visible.value = false
	sessionStorage.setItem('demo-modal-dismissed', 'true')
}

onMounted(() => {
	if (sessionStorage.getItem('demo-modal-dismissed') === 'true') {
		visible.value = false
	}
})
</script>

<template>
	<Teleport v-if="showDemoModal" to="body">
		<UCard
			class="fixed left-1/2 bottom-8 z-50 max-w-md -translate-x-1/2 rounded-xl border border-default bg-elevated/95 p-4 shadow-xl backdrop-blur-md"
			:ui="{
				body: 'p-4 space-y-4',
			}"
		>
			<p class="text-muted">
				This is a demo mode. You can use the app as a guest, but you will not be able to save your changes.
			</p>
			<div class="flex items-center gap-4">
				<UButton leading-icon="i-lucide-user" @click="signInAsDemoUser"> Sign in as demo user </UButton>
				<UButton color="neutral" variant="outline" leading-icon="i-lucide-x" @click="dismissDemoModal">
					Dismiss
				</UButton>
			</div>
		</UCard>
	</Teleport>
</template>
