<template>
    <button class="btn back-button" @click.prevent="$emit('click')">
        <Icon :type="IconType.back" color="black" :size="0.8" />
        <span>{{ props.label }}</span>
    </button>
</template>

<script setup lang="ts">

import Icon from './icons/Icon.vue';

import { IconType } from './icons/IconType';

const emits = defineEmits<{
    (e: 'click'): void
}>()

const props = defineProps<{ label: string }>()

</script>

<style scoped lang="scss">
.back-button {
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    min-width: 120px;
}

.back-button *:first-child {
    margin-right: 4px;
}
</style>