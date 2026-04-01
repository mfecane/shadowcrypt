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

watch(open, (v) => {
	if (import.meta.client) {
		document.body.style.overflow = v ? 'hidden' : ''
	}
})

onBeforeUnmount(() => {
	if (import.meta.client) {
		document.body.style.overflow = ''
	}
})

function onKeydown(event: KeyboardEvent): void {
	if (!open.value) {
		return
	}
	if (event.key === 'Escape') {
		event.preventDefault()
		open.value = false
	}
}

onMounted(() => {
	document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
	document.removeEventListener('keydown', onKeydown)
})

function toggle(): void {
	open.value = !open.value
}

function close(): void {
	open.value = false
}
</script>

<template>
	<Teleport v-if="showDevTools" to="body">
		<UButton
			variant="ghost"
			type="button"
			:class="[
				'border-muted bg-neutral-800 text-default hover:bg-neutral-700 fixed right-4 bottom-24 z-[199]',
				'flex items-center justify-center gap-2 rounded-full border p-2 text-sm font-medium shadow-lg',
				'w-11 h-11 text-primary',
			]"
			:aria-expanded="open"
			aria-controls="dev-panel-dialog"
			@click="toggle"
		>
			<Icon name="lucide:wrench" class="h-6 w-6 shrink-0" aria-hidden="true" />
		</UButton>
		<Transition name="devpanel-fade">
			<div
				v-if="open"
				id="dev-panel-dialog"
				class="fixed inset-0 z-[199] flex items-center justify-center overflow-y-auto bg-black/55 p-2 backdrop-blur-[2px]"
				role="dialog"
				aria-modal="true"
				aria-label="Dev panel"
				@click.self="close"
			>
				<div
					class="border-muted bg-elevated text-default w-full max-w-md rounded-xl border p-4 shadow-2xl"
					@click.stop
				>
					<div class="mb-3 flex items-start justify-between gap-3">
						<div>
							<p class="text-muted text-xs font-medium tracking-wide uppercase">Dev panel</p>
							<p class="text-muted mt-1 text-xs">Local services (see README)</p>
						</div>
						<button
							type="button"
							class="text-muted hover:text-default rounded-md p-1"
							aria-label="Close"
							@click="close"
						>
							<span class="i-lucide-x h-5 w-5" />
						</button>
					</div>
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
					<p class="text-muted mt-3 text-xs">Esc to close</p>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.devpanel-fade-enter-active,
.devpanel-fade-leave-active {
	transition: opacity 0.15s ease;
}

.devpanel-fade-enter-from,
.devpanel-fade-leave-to {
	opacity: 0;
}
</style>
