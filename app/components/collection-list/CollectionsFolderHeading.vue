<script setup lang="ts">
withDefaults(defineProps<{ folderId: string; name: string; linkable?: boolean }>(), { linkable: true })

const emit = defineEmits<{ edit: [] }>()
</script>

<template>
	<div class="mb-4 flex min-w-0 flex-wrap items-center gap-2">
		<NuxtLink
			v-if="linkable"
			:to="`/list/${folderId}`"
			class="hover:text-beige-300 min-w-0 flex-1 text-left transition-colors"
		>
			<h2 class="text-muted truncate text-sm font-semibold uppercase tracking-wider">{{ name }}</h2>
		</NuxtLink>
		<h2 v-else class="text-muted min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-wider">
			{{ name }}
		</h2>
		<button
			type="button"
			class="text-muted hover:text-highlighted shrink-0 rounded-md px-2 py-1 text-xs font-medium uppercase tracking-wide transition-colors"
			@click="emit('edit')"
		>
			Edit
		</button>
	</div>
</template>
