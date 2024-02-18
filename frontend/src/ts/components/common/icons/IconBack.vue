<template>
    <svg class="icon_back" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70.04 117.43">
        <g>
            <path :fill="props.color" stroke-width="0"
                d="M67.92,7.31l-5.19-5.19c-2.83-2.83-7.42-2.83-10.25,0L2.94,51.61c-3.92,3.92-3.92,10.28,0,14.2l49.54,49.49c2.83,2.83,7.42,2.83,10.25,0l5.19-5.19c2.83-2.83,2.83-7.42,0-10.25L29.46,61.41c-1.49-1.49-1.49-3.9,0-5.39l38.46-38.46c2.83-2.83,2.83-7.42,0-10.25Z" />
        </g>
    </svg>
</template>

<script setup lang="ts">

const props = defineProps<{ color: string }>()

</script>

<style scoped lang="scss">
.icon_back {
    width: 16px;
    height: 16px;
}
</style>