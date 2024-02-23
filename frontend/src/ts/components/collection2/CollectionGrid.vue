<template>
    <div class="colection-container" @mousedown.prevent="onMouseDown" @mousemove.prevent="onMouseMove"
        @mouseup.prevent="onMouseUp" @wheel.prevent="onWheel" @click.prevent="onClick">
        <div :style="style" class='image-list' ref="imageList">
            <CollectionImage v-for="image of props.collection.images" :id="image.id" :width="image.width ?? 0"
                :height="image.height ?? 0" :src="image.path" />
        </div>
    </div>
</template>

<script setup lang="ts">

// TODO change orientation to album

import CollectionImage from '@/ts/components/collection2/CollectionImage.vue'

import { StyleValue, computed, ref } from 'vue'
import { CollectionWithImages } from '@/ts/model/Data'
import { grid } from '@/ts/hooks/grid'
import { useCollectionViewer } from '@/ts/hooks/useCollectionViewer'
import { clamp } from 'lodash'

type Vector2 = { x: number, y: number }

const props = defineProps<{ collection: CollectionWithImages }>()

const imageList = ref<HTMLDivElement>()

const collectionViewer = useCollectionViewer()

let isDragging = false
let startX: number = 0
let startY: number = 0

const translation = ref<Vector2>({ x: 0, y: 0 })
const scale = ref(1)

const style = computed<StyleValue>(() => {
    const columns = Math.ceil(Math.sqrt(props.collection.images.length))
    return grid(columns, collectionViewer.orientation, scale.value, translation.value.x, translation.value.y)
})

function onMouseDown(e: MouseEvent) {
    isDragging = true
    startX = e.clientX
    startY = e.clientY
}

function onMouseMove(e: MouseEvent) {
    if (isDragging && imageList.value) {
        translation.value.x += e.clientX - startX
        translation.value.y += e.clientY - startY
        startX = e.clientX
        startY = e.clientY
    }
}

function onMouseUp() {
    isDragging = false
}

function clientPosToTranslatedPos({ x, y }: Vector2) {
    return {
        x: x - translation.value.x,
        y: y - translation.value.y
    }
}

function coordChange(coordinate: number, scaleRatio: number) {
    return (scaleRatio * coordinate) - coordinate
}

function scaleFromPoint(newScale: number, focalPt: Vector2) {
    const scaleRatio = newScale / (scale.value != 0 ? scale.value : 1)
    const focalPtDelta = {
        x: coordChange(focalPt.x, scaleRatio),
        y: coordChange(focalPt.y, scaleRatio)
    }
    translation.value = {
        x: translation.value.x - focalPtDelta.x,
        y: translation.value.y - focalPtDelta.y
    }
    scale.value = newScale
}

function onWheel(e: WheelEvent) {
    const newScale = clamp(scale.value + (1 - 2 ** (e.deltaY * 0.003)), 0.25, 4.0)
    const mousePos = clientPosToTranslatedPos({ x: e.clientX, y: e.clientY })
    scaleFromPoint(newScale, mousePos)
}


function onClick(e: MouseEvent) {
    e.stopPropagation()
    collectionViewer.select()
}

</script>

<style lang="scss" scoped>
.colection-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.image-list {
    display: inline-grid;
    grid-auto-rows: 40px;
    gap: 4px;
    transform-origin: 0 0;
}
</style>