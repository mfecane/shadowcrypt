<template>
	<Header></Header>

	<Loader v-if="loading" size="large" class="loader-gap" caption />

	<template v-else>
		<div v-if="filter && filteredCollection.length">
			<div class="container">
				<MainGrid v-if="filteredCollection.length" :collections="filteredCollection" />
			</div>
		</div>

		<div v-if="filter && !filteredCollection.length" class="no-collections">
			<div class="container">
				No collections, satisfying criteria
			</div>
		</div>

		<div v-if="pinnedCollections.length" class="pinned-bg">
			<div class='container'>
				<h2>PINNED</h2>
				<FirstRow :collections="pinnedCollections" />
			</div>
		</div>

		<div v-if="!filter" class='recent'>
			<div class='container'>
				<h2>RECENT</h2>
				<FirstRow v-if="firstRow.length" :collections="firstRow" />
				<MainGrid v-if="secondRow.length" :collections="secondRow" />
			</div>
		</div>

		<div v-if="!collectionExist" class="no-collections">
			<div class="container">
				No collections
			</div>
		</div>
	</template>

</template>

<script setup lang="ts">

import FirstRow from '@/components/list/FirstRow.vue'
import MainGrid from '@/components/list/MainGrid.vue'
import Header from '@/components/common/Header.vue'
import Loader from '@/components/common/Loader.vue'

import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useCollectionList, fetch } from '@/hooks/useCollectionList'

const {
	filteredCollection, pinnedCollections, firstRow, secondRow, collectionExist, filter, loading
} = storeToRefs(useCollectionList())

onMounted(() => fetch())

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

h2 {
	margin-top: 8px;
	margin-bottom: 8px;
	font-size: 24px;
	font-weight: 600;
}

.pinned-bg h2 {
	color: #4d575c;
}

.recent h2 {
	color: #3c4246;
}

.loader-gap {
	margin-top: 40px;
}
</style>
