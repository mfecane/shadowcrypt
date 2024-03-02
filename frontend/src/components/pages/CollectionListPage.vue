<template>
    <CollectionsList v-if="user" />
</template>

<script setup lang="ts">

import CollectionsList from '@/components/list/CollectionsList.vue'

import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useAuth } from '@/hooks/useAuth';

const router = useRouter()
const { user } = storeToRefs(useAuth())

watch(user, (user) => {
    if (!user) {
        router.push('/landing')
    }
}, { immediate: true })

</script>

<style lang="scss" scoped>
.no-collections {
    padding-top: 20px;
    font-size: 20px;
    font-weight: 500;
    color: var(--accent-color)
}

.pinned-bg {
    position: relative;
    padding: 6px 0;
    background-color: var(--color-darkish);
}

.loader-gap {
    margin-top: 40px;
}
</style>
