<template>
    <div class="breadcrumbs">
        <BackButton @click="router.back()" label="Back" />
        <span class="title">{{ props.name }}</span>
        <div class="buttons">
            <template v-if="collectionViewer.selected">
                <IconButton :type="IconType.cross" @click="confirmDelete()" />
            </template>
            <div class="separator"></div>
            <IconButton :type="IconType.pencil" @click="renameRef.showModal()" />
            <IconButton :type="iconType" @click="() => collectionViewer.changeOrientation()" />
            <IconButton :type="IconType.fill" />
        </div>
        <Confirmation @ok="deletePin2" ref="confirmationRef" />
        <Dialog @ok="renameCollection2()" ref="renameRef">
            <p>Rename collection</p>
            <input type="text" class="rename-collection" v-model="collectionName" />
        </Dialog>
    </div>
</template>

<script setup lang="ts">

// TODO rename to menu

import IconButton from '@/components/common/inputs/IconButton.vue'
import BackButton from '@/components/common/BackButton.vue'
import Confirmation from '@/components/common/Confirmation.vue'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Orientation, useCollectionViewer } from '@/hooks/useCollectionViewer'
import { IconType } from '@/components/common/icons/IconType'
import { deleteImage } from '@/api/images'
import Dialog from '../common/Dialog.vue'
import { renameCollection } from '@/api/collections'

const router = useRouter()
const collectionViewer = useCollectionViewer()

const props = defineProps<{
    name: string
    id: string
}>()

const confirmationRef = ref()
const renameRef = ref()
const collectionName = ref<string>(props.name)

const iconType = computed(() => {
    switch (collectionViewer.orientation) {
        case Orientation.horizontal: return IconType.horizontal
        case Orientation.vertical: return IconType.vertical
        default: throw new Error('Unhandled case')
    }
})

function confirmDelete() {
    confirmationRef.value.showModal()
}

function deletePin2() {
    const { selected } = collectionViewer
    if (selected) {
        deleteImage(selected)
        collectionViewer.select()
    }
}

async function renameCollection2() {
    await renameCollection(props.id, collectionName.value)
}

</script>

<style lang="scss" scoped>
.breadcrumbs {
    position: fixed;
    top: 12px;
    left: 12px;
    right: 12px;
    background-color: var(--bg-color-dark);
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 2px 2px 8px #00000050, 1px 1px 2px #00000050;
    z-index: 2;
    display: flex;
    align-items: center;
}

.title {
    margin-left: 20px;
    color: var(--color-light);
    font-weight: 500;
    font-size: 20px;
}

.buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1 0 auto;

    & *:not(:last-child) {
        margin-right: 12px;
    }
}

.rename-collection {
    min-width: 500px;
}

.separator {
    width: 2px;
}
</style>