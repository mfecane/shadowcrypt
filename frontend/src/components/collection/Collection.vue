<template>
    <Fullscreen />
    <CollectionMenu :id="props.id" :name="name ?? ''" />
    <Loader v-if="loading" size="large" class="grid-loader" caption />
    <CollectionGrid v-else />
</template>

<script setup lang="ts">

import CollectionMenu from '@/components/collection/CollectionMenu.vue'
import CollectionGrid from '@/components/collection/CollectionGrid.vue';
import Loader from '../common/Loader.vue';
import Fullscreen from './Fullscreen.vue';

import { onBeforeUnmount, onMounted } from 'vue';

import { useUploadDialog } from '@/hooks/useUploadDialog';
import { fetch, useCollectionViewer } from '@/hooks/useCollectionViewer';
import { storeToRefs } from 'pinia';

const uploadDialog = useUploadDialog()

const props = defineProps<{ id: string }>()

const store = useCollectionViewer()

const { name, images, loading } = storeToRefs(store)

onMounted(() => {
    fetch(props.id)
    uploadDialog.setSelectedCollection(props.id)
})

onBeforeUnmount(() => store.clear())

</script>

<style lang="scss" scoped>
.grid-loader {
    position: absolute;
    top: 160px;
    left: 50%;
    transform: translateX(-50%);
}
</style>