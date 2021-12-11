
<template>
    <dialog class="create-dialog" ref="dialogRef" @click="onClick"
        @close.prevent="() => dialogStore.setShowCreateModal(false)">
        <form class="container" @submit.prevent="upload">
            <CollectionSelector v-model="collectionId" />
            <UploadFile />
            <button type="submit" class="btn">Create</button>
        </form>
    </dialog>
</template>
  
<script setup lang="ts">

// TODO clear url upon discard

import { useCollections } from '@/ts/hooks/useCollections';
import { ref, computed, onMounted, ComputedRef, watch } from 'vue'
import CollectionSelector from '@/ts/components/create/CollectionSelector.vue'
import { useUploadDialog } from '@/ts/hooks/useUploadDialog';
import UploadFile from '@/ts/components/create/UploadFile.vue';
import { createPin } from '@/ts/api/loader'

const collectionsStore = useCollections()
const dialogStore = useUploadDialog()

const dialogRef = ref<HTMLDialogElement>()

const collectionId = ref<string | null>(null)

onMounted(() => {
    collectionsStore.load()
})

watch(() => dialogStore.showCreateModal, (value) => {
    if (value) {
        dialogRef?.value?.showModal()
    } else {
        dialogRef?.value?.close()
    }
}, { immediate: true })

function onClick(event: MouseEvent) {
    if (event.target === dialogRef?.value) {
        dialogStore.discardDialog()
    }
}

async function upload() {
    if (dialogStore.imageId && collectionId.value) {
        await createPin(dialogStore.imageId, collectionId.value)
        dialogStore.setImageId(null)
        dialogStore.closeDialog()
    }
}

</script>
  
<style scoped lang="scss">
.create-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0px;
    border-radius: 6px;

    min-width: 600px;

    &>div {
        padding: 32px;
    }
}

.container {
    margin: 40px;
    display: flex;
    flex-direction: column;

    &>*:not(:first-child) {
        margin-top: 8px;
    }
}

input[type=text].add {
    border: 1px solid black;
    padding: 12px;
    border-radius: 4px;
}
</style>
