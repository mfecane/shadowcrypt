
<template>
    <div class="collection-options">
        <span class="hint">
            {{ hintText }}
        </span>
        <button class="pin" @click.prevent="pinCollection" @mouseenter="() => { hintText = 'Pin' }"
            @mouseleave="() => { hintText = '' }">
            <IconPin />
        </button>
        <button class="pin" @click.prevent="editCollection" @mouseenter="() => { hintText = 'Edit' }"
            @mouseleave="() => { hintText = '' }">
            <IconPencil />
        </button>
        <button class="pin" @click.prevent="editCollection" @mouseenter="() => { hintText = 'Delete' }"
            @mouseleave="() => { hintText = '' }">
            <IconBasket />
        </button>
    </div>
</template>
  
<script setup lang="ts">

import IconPin from '@/ts/components/common/icons/IconPin.vue';
import IconPencil from '@/ts/components/common/icons/IconPencil.vue';
import IconBasket from '@/ts/components/common/icons/IconBasket.vue';

import { ref } from 'vue';

const hintText = ref<string>('')

function pinCollection() {
    throw new Error('Not implemented')
}

function editCollection() {
    throw new Error('Not implemented')
}


</script>
  
<style scoped lang="scss">
.collection-options {
    background-color: var(--bg-color-dark);
    border-radius: 4px;
    display: flex;
    padding: 10px 12px;
    align-items: center;
}

.collection-options>*:not(:last-child) {
    margin-right: 8px;
}

.pin {
    background-color: transparent;
    outline: none;
    width: 24px;
    height: 24px;
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

.hint {
    min-width: 100px;
    color: var(--color-light2);
    font-size: 14px;
}
</style>
