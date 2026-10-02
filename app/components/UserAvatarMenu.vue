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
	<UDropdownMenu v-if="user" :items="items" :content="{ align: 'end' }">
		<template #content-top="{ sub }">
			<div v-if="!sub" class="p-1 border-t border-default">
				<ColorModeTabs />
			</div>
		</template>

		<UButton
			color="neutral"
			variant="ghost"
			square
			class="rounded-full"
			:aria-label="`Account menu for ${user.email}`"
		>
			<UAvatar :src="avatarUrl || undefined" :alt="user.name ?? user.email" size="md" />
		</UButton>
	</UDropdownMenu>
</template>
