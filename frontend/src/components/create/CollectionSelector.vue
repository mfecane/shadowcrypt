<template>
    <div class="collection-container">
        <div class="searcher">
            <input type="text" id="collection-selector-prompt" v-model="searchPrompt" class="prompt" ref="inputRef">
            <div class="hint">
                <Icon :type="IconType.search" :size="1.25" v-if="!searchPrompt" />
                <span>Find</span>
            </div>
            <button class="create-button" v-if="canCreateCollection" @click="createCollection3">Create</button>
        </div>

        <div v-if="filteredList.length" class="list">
            <div class="filteredlist">
                <div v-for="collection in filteredList" :key="collection.id" class="item"
                    @click="() => onSelect(collection.id)">
                    {{ collection.name }}
                </div>
            </div>
        </div>

        <div v-else class="list">No collections found</div>
    </div>
</template>

<script setup lang="ts">

import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, ref } from 'vue'
import FuzzySearch from 'fuzzy-search'

import Icon from '@/components/common/icons/Icon.vue'
import { IconType } from '../common/icons/IconType'

import { Collection } from '@/model/Data';
import { useAuth } from '@/hooks/useAuth';
import { useCollectionSelector, fetch } from '@/hooks/useCollectionSelector'
import { useUploadDialog, Steps, createCollection2 } from '@/hooks/useUploadDialog'

/**
 * TODO
 * 
 * clear search button
 */

const { collections } = storeToRefs(useCollectionSelector())

const { user } = storeToRefs(useAuth())

const dialogStore = useUploadDialog()

const { getSelectedCollection } = storeToRefs(dialogStore)

const searchPrompt = ref('')

const inputRef = ref<HTMLInputElement>()

const filteredList = computed<Collection[]>(() => {
    const value: string | undefined = searchPrompt.value
    if (value) {
        const searcher = new FuzzySearch(collections.value, ['name'], {
            caseSensitive: false,
            sort: true,
        })
        return searcher.search(value.toLocaleLowerCase())
    } else {
        return collections.value
    }
})

function onSelect(name: string) {
    searchPrompt.value = ''
    dialogStore.setSelectedCollection(name)
    dialogStore.step = Steps.upload_image
}

function strEqual(str1: string, str2: string) {
    return str1.trim().toLowerCase() === str2.trim().toLowerCase()
}


async function createCollection3() {
    await createCollection2(searchPrompt.value)
    searchPrompt.value = ''
}

const canCreateCollection = computed(() => {
    return searchPrompt.value && !strEqual(searchPrompt.value, getSelectedCollection.value?.name ?? '')
})

onMounted(async () => {
    await fetch()
    inputRef.value?.focus()
})

</script>

<style scoped lang="scss">
.collection-container {
    display: grid;
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 100%;

    &>*:not(:first-child) {
        margin-top: 20px;
    }
}

.list {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
}

.prompt {
    padding: 12px;
}

.item {
    background-color: var(--color-light);
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;

    &:last-of-type {
        margin-bottom: 0px;
    }

    &:hover {
        box-shadow: inset 0px 0px 0px 1px black;
    }

    &.selected {
        margin-top: 20px;
        background-color: var(--accent-color-dark);
        font-weight: 500;
        color: var(--color-light);
    }
}

.filteredlist {
    overflow-y: scroll;
    padding-right: 4px;
}

.searcher {
    border: 1px solid black;
    border-radius: 4px;
    display: flex;
    position: relative;
}

.searcher>input {
    flex: 1 1 auto
}

.searcher .hint {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 12px;
    display: flex;
    align-items: center;
    color: #a5aeb7;

    &>*:not(:first-child) {
        margin-left: 6px;
    }
}

.searcher :deep(.icon path) {
    fill: #a5aeb7;
}


input:focus~.hint {
    opacity: 0;
}

.create-button {
    background-color: var(--accent-color-dark);
    color: var(--accent-color-light);
    padding: 8px;
}
</style>