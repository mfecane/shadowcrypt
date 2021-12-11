
<template>
    <div class="collection-container">
        <input type="text" v-model="searchPrompt" class="prompt">
        <div v-if="filteredList.length" class="list">
            <div v-for="collection in filteredList" :key="collection.id" class="item" :class="{
                'selected': collection.id === collectionId
            }" @click="() => onSelect(collection.id)">
                {{ collection.name }} {{ collection.id }}
            </div>
        </div>
        <button class="create-button" v-else @click="createCollection">Create</button>
    </div>
</template>
  
<script setup lang="ts">
import { useCollections } from '@/ts/hooks/useCollections';
import { ref, computed } from 'vue'

/**
 * TODO
 * 
 * clear search button
 */

const collections = useCollections()

const searchPrompt = defineModel<string>('')
// const selected = ref<string>('')
const collectionId = defineModel<string | null>({ default: null })

const filteredList = computed(() => {
    const value: string | undefined = searchPrompt.value
    if (value) {
        return collections.collections.filter(it => it.name.includes(value))
    }
    return collections.collections
})

function onSelect(name: string) {
    collectionId.value = name
}

function createCollection() {
    const value: string | undefined = searchPrompt.value
    if (value) {
        collections.createCollection(value)
    }
}

</script>
  
<style scoped lang="scss">
.create-button {
    margin-top: 20px;
    padding: 12px;
    border-radius: 4px;
}

.collection-container {
    display: grid;
    grid-template-columns: 1fr;
    display: flex;
    flex-direction: column;
}

.list {
    display: flex;
    flex-direction: column;
}

.prompt {
    border: 1px solid black;
    padding: 12px;
    border-radius: 4px;
}

.item {
    background-color: rgb(216, 220, 219);
    padding: 12px;
    border-radius: 4px;
    margin-top: 12px;

    &:first-of-type {
        margin-top: 20px;
    }

    &:hover {
        box-shadow: inset 0px 0px 0px 1px black;
    }

    &.selected {
        background-color: rgb(153, 217, 235);
        font-weight: bold;

    }
}
</style>
