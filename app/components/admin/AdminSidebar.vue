<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { user } = useUserSession()

const items: NavigationMenuItem[][] = [
	[{ label: 'Back to site', icon: 'i-lucide-arrow-left', to: '/list' }],
	[{ label: 'Jobs', icon: 'i-lucide-workflow', to: '/admin/jobs' }],
]
</script>

<template>
	<aside data-id="admin-sidebar" class="border-default flex w-60 shrink-0 flex-col gap-4 border-r p-4">
		<div>
			<p class="text-highlighted font-semibold">Admin</p>
			<p class="text-muted truncate text-xs">{{ user?.email }}</p>
		</div>
		<UNavigationMenu orientation="vertical" :items="items" />
	</aside>
</template>
