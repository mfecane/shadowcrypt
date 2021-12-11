<template>
	<a href="#" @click.prevent="router.back()">Back</a>
	<div className='image-list' v-if="collection">
		<CollectionImage v-for="image of collection.images" :width="image.width ?? 0" :height="image.height ?? 0"
			:src="image.path" />
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCollections2 } from '../hooks/useCollections2';
import CollectionImage from './CollectionImage.vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const props = defineProps<{ id: string }>()
const store = useCollections2()
const { getById } = storeToRefs(store)
const router = useRouter()

onMounted(() => {
	store.load()
})

// TODO wierd pattern
const collection = computed(() => getById.value(props.id))
</script>

<style lang="scss" scoped>
.image-list {
	width: 100%;
	gap: 20px;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-auto-rows: 120px;
}

.image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.image-container {
	padding: 3px;
	border: 1px solid rgb(202, 208, 209);
	padding: 4px;
	border-radius: 3px;
	box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.1);
	min-height: 0;
	position: relative;
}

.image-container-1 {
	grid-row-start: span 1;
}

.image-container-2 {
	grid-row-start: span 2;
}

.image-container-3 {
	grid-row-start: span 3;
}

.image-container-4 {
	grid-row-start: span 4;
}
</style>