<script setup lang="ts">
const isDev = import.meta.dev
const { user, ready } = useUserSession()

const open = ref(false)

const showDevTools = computed(() => {
	if (!isDev) {
		return false
	}
	if (!ready.value) {
		return false
	}
	return user.value?.isAdmin === true
})

const devLinks = [
	{ label: 'localhost:3000 — dev', href: 'http://localhost:3000/' },
	{ label: 'localhost:8025 — mailpit', href: 'http://localhost:8025/' },
	{ label: 'localhost:8084 — adminer', href: 'http://localhost:8084/' },
	{ label: 'localhost:9001 — minio', href: 'http://localhost:9001/' },
	{ label: 'localhost:3000/style-test', href: 'http://localhost:3000/style-test' },
] as const

function toggle(): void {
	open.value = !open.value
}
</script>

<template>
	<div v-show="showDevTools">
		<GlassFabButton icon="i-lucide-wrench" @click="toggle" tooltip="Dev panel" />
	</div>
	<Teleport v-if="showDevTools" to="body">
		<UModal v-model:open="open" title="Dev panel" description="Local services (see README)">
			<template #body>
				<ul class="space-y-1">
					<li v-for="item in devLinks" :key="item.href">
						<a
							:href="item.href"
							class="text-primary hover:underline flex items-center gap-2 rounded-lg px-2 py-2 text-sm"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span class="i-lucide-external-link text-muted h-4 w-4 shrink-0" />
							{{ item.label }}
						</a>
					</li>
				</ul>
			</template>
		</UModal>
	</Teleport>
</template>
