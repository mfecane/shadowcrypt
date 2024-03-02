<template>
    <div class="collection-options">
        <button class="pin" @click.prevent="pinCollection2">
            <Icon :type="IconType.pin" :size="1.3" />{{ pinLabel }}
        </button>
        <button class="pin" @click.prevent="editCollection">
            <Icon :type="IconType.pencil" :size="1.3" />Edit
        </button>
        <button class="pin" @click.prevent="deleteCollection">
            <Icon :type="IconType.basket" :size="1.3" />Delete
        </button>
    </div>
</template>

<script setup lang="ts">

import Icon from '../common/icons/Icon.vue';

import { CollectionWithImages } from '@/model/Data';
import { IconType } from '../common/icons/IconType';
import { pinCollection } from '@/hooks/useCollectionList';
import { computed, toRefs } from 'vue';
import { useDialogs } from '@/hooks/useDialogs';

const props = defineProps<{ collection: CollectionWithImages, collectionId: string }>()

const { collection } = toRefs(props)

const dialogs = useDialogs()

function pinCollection2() {
    pinCollection(props.collectionId)
}


function editCollection() {
    dialogs.editCollection(props.collection.id)
}

function deleteCollection() {
    dialogs.deleteCollection(props.collection.id)
}


const pinLabel = computed(() => { return collection.value.pinned ? 'Unpin' : 'Pin' })

</script>

<style scoped lang="scss">
.collection-options {
    position: absolute;
    top: 48px;
    right: 0px;
    z-index: 1;
    background-color: var(--color-darker);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    padding: 16px 12px;
}

.collection-options>*:not(:first-child) {
    margin-top: 12px;
}

.pin {
    background-color: transparent;
    outline: none;
    min-width: 160px;
    display: flex;
    color: var(--accent-color);
    font-weight: 500;
    align-items: center;
}

.pin :deep(.icon) {
    flex: 0 0 28px;
}

.pin :deep(path) {
    fill: var(--color-light2);
    transition: all 400ms ease;
}

.pin:hover :deep(path) {
    fill: var(--color-light3);
}

.pin :deep(rect) {
    fill: var(--color-light2);
    transition: all 400ms ease;
}

.pin:hover :deep(rect) {
    fill: var(--color-light3);
}
</style>
