<template>
    <div class="image-container" :class="{
        'selected': props.id === collectionViewer.selected
    }" :style="style" @click="onClick">
        <img :src="props.src" class='image' />
    </div>
</template>


<script setup lang="ts">

import { gridElement } from '@/hooks/grid';
import { useCollectionViewer } from '@/hooks/useCollectionViewer';
import { StyleValue, computed } from 'vue';

const props = defineProps<{ id: string, width: number, height: number, src: string }>()

const collectionViewer = useCollectionViewer()

let style = computed<StyleValue>(() =>
    gridElement(collectionViewer.orientation, props.height / props.width))

function onClick(e: MouseEvent) {
    e.stopPropagation()
    collectionViewer.select(props.id)
}

</script>
  
<style scoped lang="scss">
.image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 3px;
}

.image-container {
    padding: 2px;
    border-radius: 4px;
    background-color: black;
    box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.2);
    min-height: 0;
    position: relative;
    overflow: hidden;
}

.image-container.selected:before {
    content: '';
    display: block;
    position: absolute;
    width: 64px;
    height: 64px;
    background: top left / cover url(images/select.svg) no-repeat;
}
</style>