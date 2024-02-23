<template>
    <div v-if="pinnedCollections.length" class="wrapper">
        <FirstRow :collections="pinnedCollections" />
        <div class="backdrop"></div>
    </div>
</template>
  
<script setup lang="ts">

import { storeToRefs } from 'pinia';
import FirstRow from '../FirstRow.vue';

import { useCollectionList } from '@/ts/hooks/useCollectionList';

const { pinnedCollections } = storeToRefs(useCollectionList())

</script>
  
<style scoped lang="scss">
.wrapper {
    position: relative;
    padding: 6px 0;
    background-color: var(--bg-color-dark);
}
</style>
