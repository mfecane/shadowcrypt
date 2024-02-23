<template>
    <IconButton v-if="user?.id" :type="IconType.plus" @click="store.showCreateDialog()" class="create-button" />
</template>

<script setup lang="ts">
import IconButton from './inputs/IconButton.vue';

import { storeToRefs } from 'pinia';

import { IconType } from './icons/IconType';
import { useUploadDialog } from '@/ts/hooks/useUploadDialog';
import { useAuth } from '@/ts/hooks/useAuth';

const store = useUploadDialog()

const { user } = storeToRefs(useAuth())

</script>

<style scoped lang="scss">
.create-button {
    right: max((calc((100% - 1280px)/ 2)), 20px);
    position: fixed;
    bottom: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 2px 2px 8px #00000050, 1px 1px 2px #00000050;

    & :deep(svg path) {
        fill: var(--accent-color-dark);
    }
}
</style>