<template>
    <button class="btn input signup-google" @click.prevent="GluGlu">
        <Icon :type="IconType.google" />
        Sign up with google
    </button>
</template>

<script setup lang="ts">
import Icon from '@/components/common/icons/Icon.vue'

import { useRouter } from 'vue-router';

import { IconType } from '@/components/common/icons/IconType'
import { signInWithGluGlu } from '@/hooks/useAuth';

const router = useRouter()

async function GluGlu() {
    if (await signInWithGluGlu()) {
        router.push('/list')
    }
}
</script>

<style scoped lang="scss">
.signup-google {
    display: flex;

    &>:deep(*:first-child) {
        margin-right: 6px;
    }

    :deep(.icon) path {
        fill: black;
    }
}
</style>
