<template>
    <div class="breadcrumbs">
        <button @click="router.back()" class="round">
            <Icon :type="IconType.dots" :size="1.5" />
        </button>
        <span class="title">{{ props.name }}</span>
        <button @click="router.back()" class="round">
            <Icon :type="IconType.back" :size="1.5" />
        </button>
    </div>
</template>

<script setup lang="ts">

// TODO rename to menu

import IconButton from '@/components/common/inputs/IconButton.vue'
import Icon from '@/components/common/icons/Icon.vue'
import Confirmation from '@/components/common/Confirmation.vue'

import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Orientation, useCollectionViewer } from '@/hooks/useCollectionViewer'
import { deleteImage } from '@/api/images'
import Dialog from '../common/Dialog.vue'
import { renameCollection } from '@/api/collections'
import { IconType } from '@/components/common/icons/IconType'

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
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-darker);
    padding: 8px 7px;
    border-radius: 999px;
    box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.3);
    z-index: 2;
    display: flex;
    align-items: center;
}

.title {
    display: block;
    min-width: 200px;
    text-align: center;
    margin: 0 20px;
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

.round {
    width: 48px;
    height: 48px;
    min-width: unset;
    background-color: var(--color-darkish);
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(.icon circle),
    :deep(.icon path) {
        fill: var(--accent-color)
    }
}
</style>