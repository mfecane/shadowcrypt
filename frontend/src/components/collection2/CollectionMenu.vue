<template>
    <div class="breadcrumbs">
        <div class="header">
            <button @click="showMenu = !showMenu" class="round">
                <Icon :type="IconType.dots" :size="1.5" />
            </button>
            <div class="title">{{ props.name }}</div>
            <button @click="router.back()" class="round">
                <Icon :type="IconType.back" :size="1.5" />
            </button>
        </div>
        <ul v-if="showMenu" class="menu">
            <li>
                <a href="#" @click.prevent="collectionViewer.changeOrientation()">Change layout</a>
            </li>
            <li>
                <a href="#" @click.prevent="collectionViewer.resetScale2()">Scale to fit</a>
            </li>
            <li>
                <a href="#" @click.prevent="">Edit colleciton</a>
            </li>
            <li>Help</li>
        </ul>
    </div>
</template>

<script setup lang="ts">

import Icon from '@/components/common/icons/Icon.vue'

import { ref } from 'vue';
import { useRouter } from 'vue-router'

import { IconType } from '@/components/common/icons/IconType'
import { useCollectionViewer } from '@/hooks/useCollectionViewer';

const router = useRouter()

const collectionViewer = useCollectionViewer()

const showMenu = ref(false)

const props = defineProps<{
    name: string
    id: string
}>()

</script>

<style lang="scss" scoped>
.breadcrumbs {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-darker);
    padding: 0 4px;
    border-radius: 22px;
    box-shadow: 1px 1px 8px rgba(0, 0, 0, 0.3);
    z-index: 2;
}

.header {
    display: flex;
    height: 44px;
    align-items: center;
}

.title {
    font-size: 1.2rem;
    display: block;
    min-width: 180px;
    text-align: center;
    margin: 0 20px;
    color: var(--color-light);
    font-weight: 500;
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
    width: 36px;
    height: 36px;
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

.menu {
    color: var(--accent-color);
    padding: 24px 16px 24px 16px;
    display: flex;
    flex-direction: column;

    li {}

    &>*:not(:first-child) {
        margin-top: 16px;
    }
}
</style>