<script setup lang="ts">
const { openOverlay } = useCollectionQuickFind()

const headerRef = ref<HTMLElement | null>(null)
const searchTriggerRef = ref<HTMLElement | null>(null)
const scrolled = ref(false)

function onScroll(): void {
	scrolled.value = document.documentElement.scrollTop > 10
}

function onOpenSearch(): void {
	openOverlay()
	nextTick(() => {
		const root = searchTriggerRef.value as unknown as { $el?: HTMLElement } | null
		const input = root?.$el?.querySelector?.('input')
		if (input instanceof HTMLInputElement) {
			input.blur()
		}
	})
}

onMounted(() => {
	onScroll()
	window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
	window.removeEventListener('scroll', onScroll)
})
</script>

<template>
	<header
		ref="headerRef"
		class="collections-list-header sticky top-0 z-10 backdrop-blur-[6px] transition-[background-color,box-shadow] duration-300"
		:class="scrolled ? 'bg-[rgba(15,16,16,0.5)] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.4)]' : 'bg-transparent'"
	>
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
			<div class="flex min-w-0 flex-1 items-center gap-6">
				<NuxtLink
					to="/list"
					class="text-highlighted hover:text-beige-300 shrink-0 transition-colors"
					aria-label="Home"
				>
					<AppLogo collapsible />
				</NuxtLink>
				<div class="min-w-[200px] max-w-[600px] flex-1 cursor-pointer">
					<UInput
						ref="searchTriggerRef"
						readonly
						tabindex="0"
						:model-value="''"
						placeholder="Type to filter…"
						icon="i-lucide-search"
						size="md"
						class="w-full"
						:ui="{ base: 'w-full' }"
						autocomplete="off"
						aria-haspopup="dialog"
						aria-label="Open find collection"
						@focus="onOpenSearch"
						@click="onOpenSearch"
					/>
				</div>
			</div>
			<UserAvatarMenu class="shrink-0" />
		</div>
	</header>
</template>
