<template>
    <div class="collection-container" @click="dialogStore.switchStep()">
        <span>{{ getSelectedCollection?.name ?? 'Create collection' }}</span>
        <Icon :type="IconType.back" />
    </div>
</template>

<script setup lang="ts">

import Icon from '@/components/common/icons/Icon.vue'
import { IconType } from '../common/icons/IconType';

import { useUploadDialog } from '@/hooks/useUploadDialog';
import { storeToRefs } from 'pinia';

const dialogStore = useUploadDialog()

const { getSelectedCollection } = storeToRefs(dialogStore)

</script>

<style scoped lang="scss">
.collection-container {
    display: flex;
    border: 1px solid black;
    padding: 12px;
    border-radius: 4px;
    align-items: center;

    &>*:first-child {
        flex: 1 1 auto;
    }
}
</style>