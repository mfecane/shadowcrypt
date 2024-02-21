<template>
	<Header />
	<template v-if="collectionList.filteredCollection.length">
		<FirstRow :collections="collectionList.filteredCollection.slice(0, 3)" />
		<MainGrid :collections="collectionList.filteredCollection.slice(3)" />
	</template>
	<div v-if="collectionList.collectionExist && !collectionList.filteredCollection.length" class="no-collections">
		No collections, satisfying criteria
	</div>
	<div v-if="!collectionList.collectionExist" class="no-collections">
		No collections
	</div>
</template>

<script setup lang="ts">
import FirstRow from '@/ts/components/FirstRow.vue'
import MainGrid from '@/ts/components/MainGrid.vue'
import Header from '@/ts/components/common/Header.vue'

import { useCollections2 } from '@/ts/hooks/useCollections2';
import { onMounted, watch } from 'vue';
import { useCollectionList } from '@/ts/hooks/useCollectionList';
import { CollectionWithImages } from '@/ts/model/Data';

const collections2 = useCollections2()
const collectionList = useCollectionList()

onMounted(() => {
	collections2.load()
})

watch(() => collections2.collections, (value: CollectionWithImages[]) => {
	collectionList.init(value)
})

</script>

<style lang="scss" scoped>
.no-collections {
	padding-top: 20px;
	font-size: 20px;
	font-weight: 500;
	color: var(--accent-color)
}
</style>
