<template>
    <div class="image-container" :class="{
        'selected': props.id === collectionViewer.selected
    }" :style="style" @click="onClick">
        <img v-if="src" :src="src" class='image' ref="image" />
    </div>
</template>

<script setup lang="ts">

import { StyleValue, computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

import { gridElement } from '@/hooks/grid';
import { useCollectionViewer } from '@/hooks/useCollectionViewer';
import { ImageHandler } from '@/viewer/ImageHandler';
import { getImageDimensions, nn } from '@/utils/utils';
import { resolvePath } from '@/model/CollectionsModel';

const props = defineProps<{ id: string, width: number, height: number }>()

const dimensions = ref<{ width: number, height: number }>({ width: 1, height: 1 })


const src = ref<string | null>(null)

const image = ref<HTMLImageElement>()

const collectionViewer = useCollectionViewer()

let style = computed<StyleValue>(() =>
    gridElement(collectionViewer.orientation, dimensions.value.height / dimensions.value.width))

function onClick() {
    collectionViewer.select(props.id)
}

function onDoubleClick() {
    collectionViewer.openFullscreen(props.id)
}

let imageHandler: ImageHandler

onMounted(async () => {
    await collectionViewer.resolveImage(props.id)
    const img = nn(collectionViewer.images.find(it => it.id === props.id))
    src.value = nn(img.src)
    dimensions.value = { width: nn(img.width), height: nn(img.height) }
    nextTick(() => {
        imageHandler = new ImageHandler(image.value)
        imageHandler.addEventListener('click', onClick)
        imageHandler.addEventListener('doubleclick', onDoubleClick)
    })
})



onUnmounted(() => {
    imageHandler.removeEventListener('click', onClick)
    imageHandler.removeEventListener('doubleclick', onDoubleClick)
    //@ts-expect-error
    imageHandler = undefined
})

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
    background: top left / cover url(/assets/images/svg/select.svg) no-repeat;
}
</style>