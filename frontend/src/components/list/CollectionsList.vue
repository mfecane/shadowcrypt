<template>
	<template v-if="user">
		<Header></Header>

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
</template>

<script setup lang="ts">

import FirstRow from '@/components/FirstRow.vue'
import MainGrid from '@/components/MainGrid.vue'
import Header from '@/components/common/Header.vue'

import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useCollectionList } from '@/hooks/useCollectionList';
import { useCollectionsLocal } from '@/hooks/useCollectionsLocal';
import { CollectionWithImages } from '@/model/Data';
import { useAuth } from '@/hooks/useAuth';

const collectionListStore = useCollectionList()
const { filteredCollection, pinnedCollections, firstRow, secondRow, collectionExist, filter } = storeToRefs(collectionListStore)

const { store: collectionsLocalStore, reloadCollections } = useCollectionsLocal()
const { collections } = storeToRefs(collectionsLocalStore)

const router = useRouter()
const { user } = storeToRefs(useAuth())

if (!user) {
	router.push('/landing')
}

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
	background-color: var(--color-darkish);
}
</style>
