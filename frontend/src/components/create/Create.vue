<template>
    <dialog v-if="showCreateModal" class="create-dialog" ref="dialogRef" @click="onClick"
        @close.prevent="() => dialogStore.discardDialog()">

        <form class="container" @submit.prevent="upload" v-if="dialogStore.step === Steps.upload_image">
            <span>Save to collection</span>
            <CollectionDropdown />
            <UploadFile />
            <button type="submit" class="btn light create-button">Create</button>
        </form>

        <CollectionSelector v-if="dialogStore.step === Steps.show_selector" />

    </dialog>
</template>

<script setup lang="ts">

// TODO clear url upon discard

import UploadFile from '@/components/create/UploadFile.vue'
import CollectionSelector from '@/components/create/CollectionSelector.vue'
import CollectionDropdown from '@/components/create/CollectionDropdown.vue'

import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useUploadDialog, fetch, Steps } from '@/hooks/useUploadDialog'
import { fetch as collectionViewerFetch } from '@/hooks/useCollectionViewer'
import { assignTmpImageToCollection, subscribeToCollectionsList } from '@/model/CollectionsModel'
import { useAuth } from '@/hooks/useAuth'
import { nn } from '@/utils/utils'

const dialogStore = useUploadDialog()
const { showCreateModal, selectedCollection } = storeToRefs(dialogStore)

const { user } = storeToRefs(useAuth())

const dialogRef = ref<HTMLDialogElement>()

const collectionId = ref<string | null>(null)

watch([showCreateModal, dialogRef], ([show, dialogRef]) => {
    if (show && dialogRef) {
        dialogRef.showModal()
    } else if (dialogRef) {
        dialogRef.close()
    }
}, { immediate: true })

function onClick(event: MouseEvent) {
    if (event.target === dialogRef?.value) {
        dialogStore.discardDialog()
    }
}

async function upload() {
    if (dialogStore.imageId && collectionId.value) {
        const { imageId } = dialogStore
        const collectionId2 = collectionId.value
        dialogStore.setImageId(null)
        dialogStore.closeDialog()
        await assignTmpImageToCollection(collectionId2, imageId, nn(user.value?.id))
        await collectionViewerFetch(collectionId2)
    }
}

watch(selectedCollection, (id) => {
    collectionId.value = id
})

onMounted(() => fetch())

</script>

<style scoped lang="scss">
.create-dialog {
    background-color: var(--color-light3);
    border-radius: 6px;

    padding: 38px 24px;

    position: fixed;
    z-index: 2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 50vw;
    min-width: 600px;
    max-width: 800px;

    height: 80vh;
    max-height: 800px;
    box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.5);

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.3);
        pointer-events: all;
    }
}

.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    &>*:not(:last-child) {
        margin-bottom: 22px;
    }
}

.image {
    flex: 0 1 50%;

    align-self: stretch;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    & :deep(*:not(:last-child)) {
        margin-bottom: 6px;
        flex: 0 1 auto;
    }
}

.collection {
    flex: 0 1 50%;
}


.create-button {
    width: 100%;
}

input[type=text].add {
    border: 1px solid black;
    padding: 12px;
    border-radius: 4px;
}
</style>
