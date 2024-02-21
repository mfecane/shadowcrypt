<template>
	<Breadcrumbs :name="collection?.name ?? ''" v-model="size" />

	<div class='image-list' :class="listClass" v-if="collection">
		<CollectionImage v-for="image of collection.images" :width="image.width ?? 0" :height="image.height ?? 0"
			:src="image.path" />
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCollections2 } from '../hooks/useCollections2';
import CollectionImage from './CollectionImage.vue';
import { storeToRefs } from 'pinia';
import Breadcrumbs from './Breadcrumbs.vue'

const props = defineProps<{ id: string }>()
const store = useCollections2()
const { getById } = storeToRefs(store)
const size = ref(2)

onMounted(() => {
	store.load()
})

// TODO wierd pattern
const collection = computed(() => getById.value(props.id))

const listClass = computed(() => {
	switch (size.value) {
		case 1: return 'columns1';
		case 2: return 'columns2';
		case 3: return 'columns3';
		case 4: return 'columns4';
	}
})

</script>

<style lang="scss" scoped>
.image-list {
	width: 100%;
	gap: 10px;
	display: grid;
}

.columns1 {
	grid-template-columns: repeat(1, 1fr);
	grid-auto-rows: 600px;
}

.columns2 {
	grid-template-columns: repeat(2, 1fr);
	grid-auto-rows: 400px;
}

.columns3 {
	grid-template-columns: repeat(3, 1fr);
	grid-auto-rows: 200px;
}

.columns4 {
	grid-template-columns: repeat(4, 1fr);
	grid-auto-rows: 100px;
}
</style>