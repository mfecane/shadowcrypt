<template>
	<Header />

	<MainGrid v-if="filteredCollection.length" :collections="filteredCollection" />

	<div v-if="filter && !filteredCollection.length" class="no-collections">
		<div class="container">
			No collections, satisfying criteria
		</div>
	</div>

	<div v-if="pinnedCollections.length" class="pinned-bg">
		<FirstRow :collections="pinnedCollections" />
	</div>
	<FirstRow v-if="firstRow.length" :collections="firstRow" />
	<MainGrid v-if="secondRow.length" :collections="secondRow" />

	<div v-if="!collectionExist" class="no-collections">
		<div class="container">
			No collections</div>
	</div>
</template>

<script setup lang="ts">

import FirstRow from '@/ts/components/FirstRow.vue'
import MainGrid from '@/ts/components/MainGrid.vue'
import Header from '@/ts/components/common/Header.vue'

import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useCollectionList } from '@/ts/hooks/useCollectionList';
import { useCollectionsLocal } from '@/ts/hooks/useCollectionsLocal';
import { CollectionWithImages } from '@/ts/model/Data';

const collectionListStore = useCollectionList()
const { filteredCollection, pinnedCollections, firstRow, secondRow, collectionExist, filter } = storeToRefs(collectionListStore)

const { store: collectionsLocalStore, reloadCollections } = useCollectionsLocal()
const { collections } = storeToRefs(collectionsLocalStore)

watch(collections, (value: CollectionWithImages[]) => {
	collectionListStore.init(value)
})

onMounted(() => {
	reloadCollections()
})

</script>

<style lang="scss" scoped>
.no-collections {
	padding-top: 20px;
	font-size: 20px;
	font-weight: 500;
	color: var(--accent-color)
}


.pinned-bg {
	position: relative;
	padding: 6px 0;
	background-color: var(--bg-color-dark);
}
</style>
