<template>
    <ConfirmDialog v-model="deleteCollectionDialog" @ok="deleteCollection2" @cancel="cancel">
        Delete collection?
    </ConfirmDialog>
    <EditCollection v-model="editCollectionDialog" />
</template>

<script setup lang="ts">

import ConfirmDialog from '@/components/dialogs/ConfirmDialog.vue';

import { storeToRefs } from 'pinia'

import { useDialogs, deleteCollection } from '@/hooks/useDialogs'
import EditCollection from './EditCollection.vue';

const dialogs = useDialogs()

const { editCollectionDialog, deleteCollectionDialog } = storeToRefs(dialogs)

async function deleteCollection2() {
    await deleteCollection()
}

async function cancel() {
    dialogs.clear()
}
</script>

<style scoped lang="scss"></style>
