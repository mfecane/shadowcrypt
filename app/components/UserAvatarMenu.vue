<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, clear } = useUserSession()
const avatarUrl = useUserAvatarDisplayUrl()

const items = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: 'User settings',
			icon: 'i-lucide-settings',
			to: '/user',
		},
	],
	[
		{
			label: 'Log out',
			icon: 'i-lucide-log-out',
			color: 'error',
			onSelect: async () => {
				await clear()
				await navigateTo('/auth/gate')
			},
		},
	],
])
</script>

<template>
	<UDropdownMenu v-if="user" :items="items">
		<UButton
			color="neutral"
			variant="ghost"
			class="z-20 shrink-0 p-0.5 background-none hover:background-none rounded-full border border-transparent hover:border-muted"
			:aria-label="`Account menu for ${user.email}`"
		>
			<UAvatar :src="avatarUrl || undefined" :alt="user.name ?? user.email" size="md" />
		</UButton>
	</UDropdownMenu>
</template>
