<template>
    <div class="breadcrumbs">
        <BackButton @click="router.back()" label="Back" />
        <span class="title">{{ props.name }}</span>
        <div class="buttons">
            <IconButton :type="IconType.roundPlus" />
            <IconButton :type="IconType.roundMinus" />
        </div>
    </div>
</template>

<script setup lang="ts">

import { useRouter } from 'vue-router';
import { IconType } from './common/icons/IconType';
import IconButton from './common/inputs/IconButton.vue';
import BackButton from './common/BackButton.vue';

const router = useRouter()

const props = defineProps<{
    name: string
}>()

</script>

<style lang="scss" scoped>
.breadcrumbs {
    margin: 20px 0 16px 0;
    position: sticky;
    top: 8px;
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
}
</style>