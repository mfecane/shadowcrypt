<script setup lang="ts">
import CollectionsFolderHeading from '~/components/collection-list/CollectionsFolderHeading.vue'
import type { CollectionListItem } from '~/types/collections'

const props = defineProps<{
	pinned: CollectionListItem[]
	items: CollectionListItem[]
}>()

const emit = defineEmits<{ edit: [item: CollectionListItem] }>()

const isEmpty = computed(() => props.pinned.length === 0 && props.items.length === 0)
</script>

<template>
	<div class="mb-12">
		<p v-if="isEmpty" class="text-muted text-sm">Nothing in Recent yet.</p>
		<template v-else>
			<section v-if="pinned.length" class="mb-12">
				<CollectionsFolderHeading name="Pinned" :link="null" icon="i-lucide-pin" />
				<CollectionListEmphasizedGrid
					:items="pinned"
					key-prefix="pinned"
					:show-folder="true"
					@edit="emit('edit', $event)"
				/>
			</section>
			<section v-if="items.length">
				<CollectionsFolderHeading name="Recent" :link="null" icon="i-lucide-history" />
				<CollectionListEmphasizedGrid
					:items="items"
					key-prefix="recent"
					:show-folder="true"
					@edit="emit('edit', $event)"
				/>
			</section>
		</template>
	</div>
</template>
