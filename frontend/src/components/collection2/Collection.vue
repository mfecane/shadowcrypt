<template>
    <CollectionMenu :id="props.id" :name="name ?? ''" />
    <CollectionGrid v-if="images.length" />
</template>

<script setup lang="ts">

import CollectionMenu from '@/components/collection2/CollectionMenu.vue'
import CollectionGrid from '@/components/collection2/CollectionGrid.vue';

import { onMounted } from 'vue';

import { useUploadDialog } from '@/hooks/useUploadDialog';
import { fetch, useCollectionViewer } from '@/hooks/useCollectionViewer';
import { storeToRefs } from 'pinia';

const uploadDialog = useUploadDialog()

const props = defineProps<{ id: string }>()

const { name, images } = storeToRefs(useCollectionViewer())

onMounted(() => {
    fetch(props.id)
    uploadDialog.setSelectedCollection(props.id)
})

</script>

<style lang="scss" scoped></style>