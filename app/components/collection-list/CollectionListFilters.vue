<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { CollectionListFilter } from '~/types/collections'

const model = defineModel<CollectionListFilter>({ default: 'recent' })

const items = computed<TabsItem[]>(() => [
	{
		label: 'Recent',
		icon: 'i-lucide-history',
		value: 'recent',
	},
	{
		label: 'Folders',
		icon: 'i-lucide-folder',
		value: 'folders',
	},
	{
		label: 'Archived',
		icon: 'i-lucide-archive',
		value: 'archived',
	},
])
</script>

<template>
	<UTabs v-model="model" :content="false" :items="items" class="mb-8 inline-block" />
</template>
