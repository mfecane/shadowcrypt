<template>
    <dialog v-if="show" class="confirmation-dialog" ref="dialogRef" @close="onClose">
        <form @submit.prevent="onOk" method="dialog">
            <h2>Edit collection</h2>
            <label for="collectionName">Collection name</label>
            <input class="input_text" type="text" id="collectionName" v-model="collectionName">
            <div class="buttons">
                <button class="btn" type="submit">Ok</button>
                <button class="btn" type="reset" @click="onClose">Cancel</button>
            </div>
        </form>
    </dialog>
</template>

<script setup lang="ts">

import { ref, watch } from 'vue'

import { useDialogs } from '@/hooks/useDialogs';
import { storeToRefs } from 'pinia';
import { getCollectionById, updateCollection } from '@/model/CollectionsModel';
import { update } from '@/hooks/useCollectionViewer';

const show = defineModel<boolean>()

const dialogRef = ref<HTMLDialogElement>()

const collectionName = ref<string>('')

const dialogs = useDialogs()
const { collectionId: deleteCollectionId } = storeToRefs(dialogs)

watch([show, dialogRef], ([show, dialogRef]) => {
    if (show && dialogRef) {
        dialogRef.showModal()
    }
    if (!show && dialogRef) {
        dialogRef.close()
    }
})

watch(deleteCollectionId, async () => {
    if (deleteCollectionId.value) {
        const { name } = await getCollectionById(deleteCollectionId.value)
        collectionName.value = name
    }
})

async function onOk() {
    const id = deleteCollectionId.value!
    updateCollection(id, collectionName.value)
    dialogs.clear()
    await update(id)
}

function onClose() {
    dialogs.clear()
}

</script>

<style scoped lang="scss">
.confirmation-dialog {
    position: fixed;
    z-index: 2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.5);

    background-color: var(--color-dark);
    border-radius: 6px;
    padding: 24px;

    color: var(--accent-color);

    min-width: 400px;

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.3);
    }
}

h2 {
    font-size: 2rem;
}

form {

    display: flex;
    flex-direction: column;
    align-items: stretch;

    &>*:not(:last-child) {
        margin-bottom: 16px;
    }
}


.confirmation-text {
    margin-bottom: 24px;
}

.buttons {
    display: flex;
    justify-content: space-between;
}
</style>
