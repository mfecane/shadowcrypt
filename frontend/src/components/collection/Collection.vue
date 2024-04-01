<template>
    <Fullscreen />
    <CollectionMenu v-if="collection" :collection="collection" />
    <Loader v-if="loading" size="large" class="grid-loader" caption />
    <CollectionGrid v-else-if="collection" :collection="collection" />
</template>

<script setup lang="ts">

import CollectionMenu from '@/components/collection/CollectionMenu.vue'
import CollectionGrid from '@/components/collection/CollectionGrid.vue';
import Loader from '../common/Loader.vue';
import Fullscreen from './Fullscreen.vue';

import { onBeforeUnmount, watch } from 'vue';

import { useUploadDialog } from '@/hooks/useUploadDialog';
import { fetch, useCollectionViewer } from '@/hooks/useCollectionViewer';
import { storeToRefs } from 'pinia';
import { useAuth } from '@/hooks/useAuth';
import { nn } from '@/utils/utils';

const uploadDialog = useUploadDialog()

const props = defineProps<{ id: string }>()

const store = useCollectionViewer()

const { collection, loading } = storeToRefs(store)

const { user } = storeToRefs(useAuth())

watch(user, (user) => {
    if (user) {
        fetch(props.id, true, user.id)
    }
}, { immediate: true })

watch(collection, () => {
    uploadDialog.setSelectedCollection(nn(collection.value).id)
    document.title = collection.value?.name ?? 'Shadowcrypt'
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