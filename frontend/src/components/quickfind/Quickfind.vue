
<template>
    <div v-if="showPopup" class="wrapper" @click="() => store.closePopup()">
        <div class="inner">
            TODO: Implement
        </div>
    </div>
</template>
  
<script setup lang="ts">

import { storeToRefs } from 'pinia';

import { useQuickfindStore } from '@/hooks/interaction/useQuickfind'

const store = useQuickfindStore()

const { showPopup } = storeToRefs(store)

</script>
  
<style scoped lang="scss">
.wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 1;
}

.wrapper .inner {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--color-dark);
    border-radius: 5px;
    padding: 20px;
    color: var(--accent-color)
}
</style>
