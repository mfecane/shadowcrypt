<template>
	<div class='upper-grid'>
		<CollectionThumbnail v-for="(collection, index) in props.collections" :collection="collection" :key="index"
			:index="index" :big="index === 0" />
	</div>
</template>

<script setup lang="ts">
import CollectionThumbnail from '@/components/list/CollectionThumbnail.vue'
import { CollectionWithImages } from '../../model/Data';

const props = defineProps<{ collections: CollectionWithImages[] }>()
</script>

<style scoped lang="scss">
.upper-grid {
	display: grid;
	grid-template-columns: 3fr 2fr 2fr;
	grid-template-rows: 380px;
	gap: 32px;
	margin: 0px 0px 32px 0;
}
</style>../../model/Data