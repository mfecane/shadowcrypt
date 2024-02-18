
<template>
    <svg v-if="props.type === IconType.roundMinus" class="icon" :style="style" xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 134.96 134.96">
        <rect fill="black" x="23.82" y="56.76" width="87.32" height="21.45" rx="4.16" ry="4.16" />
        <path fill="black"
            d="M67.48,0C30.27,0,0,30.27,0,67.48s30.27,67.48,67.48,67.48,67.48-30.27,67.48-67.48S104.69,0,67.48,0ZM67.48,123.96c-31.14,0-56.48-25.34-56.48-56.48S36.34,11,67.48,11s56.48,25.34,56.48,56.48-25.34,56.48-56.48,56.48Z" />
    </svg>

    <svg v-if="props.type === IconType.roundPlus" class="icon" :style="style" xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 134.96 134.96">
        <path fill="black"
            d="M106.97,56.76h-24.61c-2.3,0-4.16-1.86-4.16-4.16v-24.61c0-2.3-1.86-4.16-4.16-4.16h-13.12c-2.3,0-4.16,1.86-4.16,4.16v24.61c0,2.3-1.86,4.16-4.16,4.16h-24.61c-2.3,0-4.16,1.86-4.16,4.16v13.12c0,2.3,1.86,4.16,4.16,4.16h24.61c2.3,0,4.16,1.86,4.16,4.16v24.61c0,2.3,1.86,4.16,4.16,4.16h13.12c2.3,0,4.16-1.86,4.16-4.16v-24.61c0-2.3,1.86-4.16,4.16-4.16h24.61c2.3,0,4.16-1.86,4.16-4.16v-13.12c0-2.3-1.86-4.16-4.16-4.16Z" />
        <path fill="black"
            d="M67.48,134.96C30.27,134.96,0,104.69,0,67.48S30.27,0,67.48,0s67.48,30.27,67.48,67.48-30.27,67.48-67.48,67.48ZM67.48,11c-31.14,0-56.48,25.34-56.48,56.48s25.34,56.48,56.48,56.48,56.48-25.34,56.48-56.48S98.62,11,67.48,11Z" />
    </svg>
</template>
  
<script setup lang="ts">

import { IconType } from '@/ts/components/common/icons/IconType'
import { ComputedRef, StyleValue, computed } from 'vue';

const props = withDefaults(defineProps<{ type: IconType | null, size: number }>(), {
    type: null,
    size: 32,
})

const style: ComputedRef<StyleValue> = computed(() => ({
    width: `${props.size}rem`,
    height: `${props.size}rem`,
}))

</script>
  
<style scoped lang="scss">
.icon {
    width: 32px;
    height: 32px;
}
</style>
