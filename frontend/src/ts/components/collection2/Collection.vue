<template>
    <Breadcrumbs :id="props.id" :name="collection?.name ?? ''" />
    <CollectionGrid v-if="collection" :collection="collection" />
</template>

<script setup lang="ts">

import Breadcrumbs from '@/ts/components/collection2/Breadcrumbs.vue'
import CollectionGrid from '@/ts/components/collection2/CollectionGrid.vue';

import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia'

import { useUploadDialog } from '@/ts/hooks/useUploadDialog';
import { useCollectionsLocal } from '@/ts/hooks/useCollectionsLocal';

const { store, reloadCollections } = useCollectionsLocal()
const { getById } = storeToRefs(store)

const uploadDialog = useUploadDialog()

const props = defineProps<{ id: string }>()

onMounted(() =>
    reloadCollections()
)

const collection = computed(() => getById.value(props.id))

watch(collection, (collection) => {
    if (collection) {
        uploadDialog.setSelectedCollection(collection.id)
    }
})

</script>

<style lang="scss" scoped></style>