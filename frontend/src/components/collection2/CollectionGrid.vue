<template>
    <div class="colection-container" ref="container" @wheel.prevent="onWheel" @click.prevent="onClick"
        @pointerdown.prevent="onPointerDown" @pointermove.prevent="onPointerMove" @pointerup.prevent="onPonterUp">
        <div :style="style" class='image-list' ref="imageList">
            <CollectionImage v-for="image of props.collection.images" :id="image.id" :width="image.width ?? 0"
                :height="image.height ?? 0" :src="image.path" />
        </div>
    </div>
</template>

<script setup lang="ts">

import CollectionImage from '@/components/collection2/CollectionImage.vue'

//TODO tween is overkill here
import { Tween, update as updateTween, Easing } from '@tweenjs/tween.js'
import { clamp, debounce } from 'lodash'
import { StyleValue, computed, onMounted, ref } from 'vue'

import { CollectionWithImages } from '@/model/Data'
import { grid } from '@/hooks/grid'
import { useCollectionViewer } from '@/hooks/useCollectionViewer'

//TODO decouple all this shit from vue, handle everything separately

type Vector2 = { x: number, y: number }

const MIDDLE_MOUSE_BUTTON = 1

const props = defineProps<{ collection: CollectionWithImages }>()

const container = ref<HTMLDivElement>()

const imageList = ref<HTMLDivElement>()

const collectionViewer = useCollectionViewer()

let isDragging = false
let startX: number = 0
let startY: number = 0

const translation = ref<Vector2>({ x: 0, y: 0 })
const scale = ref(1)
const virtualScale = ref(scale.value)

const style = computed<StyleValue>(() => {
    const columns = Math.ceil(Math.sqrt(props.collection.images.length))
    return grid(columns, collectionViewer.orientation, scale.value, translation.value.x, translation.value.y)
})

function onPointerDown(e: PointerEvent) {
    if (e.button === MIDDLE_MOUSE_BUTTON) {
        isDragging = true
        startX = e.clientX
        startY = e.clientY

        container.value!.setPointerCapture(e.pointerId)
    }
}

function onPointerMove(e: PointerEvent) {
    if (isDragging && imageList.value) {
        translation.value.x += e.clientX - startX
        translation.value.y += e.clientY - startY
        startX = e.clientX
        startY = e.clientY
    }
}

function onPonterUp(e: PointerEvent) {
    if (e.button === MIDDLE_MOUSE_BUTTON) {
        isDragging = false
        container.value!.releasePointerCapture(e.pointerId)
    }
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

const scaleTarget = { value: 1 }

let tween = new Tween(scaleTarget)

function animate() {
    requestAnimationFrame(() => animate())
    updateTween()
}

const setNewScale = debounce(function (e: WheelEvent) {
    tween.stop()
    tween = new Tween(scaleTarget).to({ value: virtualScale.value }, 200)
        .onUpdate(() => setScale(scaleTarget.value, e))
        // .onStop(() => { scaleTarget.value = newScale })
        .start()
}, 20)

function onWheel(e: WheelEvent) {
    virtualScale.value = clamp(virtualScale.value + (1 - 2 ** (e.deltaY * 0.005)), 0.25, 4.0)
    setNewScale(e)
}

function setScale(scale: number, e: WheelEvent) {
    const mousePos = clientPosToTranslatedPos({ x: e.clientX, y: e.clientY })
    scaleFromPoint(scale, mousePos)
}

function onClick(e: MouseEvent) {
    e.stopPropagation()
    collectionViewer.select()
}

onMounted(() => { animate() })

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