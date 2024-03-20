<template>
    <ConfirmDialog v-model="deleteCollectionDialog" @ok="deleteCollection2" @cancel="cancel">
        Delete collection?
    </ConfirmDialog>
    <ConfirmDialog v-model="deleteImageDialog" @ok="deleteImage2" @cancel="cancel">
        Delete image?
    </ConfirmDialog>
    <EditCollection v-model="editCollectionDialog" />
</template>

<script setup lang="ts">

import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';

import { storeToRefs } from 'pinia'

import { useDialogs, deleteCollection } from '@/hooks/useDialogs'
import EditCollection from './EditCollection.vue';
import { update } from '@/hooks/useCollectionViewer';
import { deleteImage } from '@/model/CollectionsModel';
import { nn } from '@/utils/utils';

const dialogs = useDialogs()

const { editCollectionDialog, deleteCollectionDialog, deleteImageDialog, collectionId, imageId } = storeToRefs(dialogs)

async function deleteCollection2() {
    await deleteCollection()
}

async function deleteImage2() {
    const collectionId2 = nn(collectionId.value)
    await deleteImage(collectionId2, nn(imageId.value))
    await update(collectionId2)
}

async function cancel() {
    dialogs.clear()
}
</script>

<style scoped lang="scss"></style>
