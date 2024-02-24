<template>
    <div class="colection-container" ref="container" @click.prevent="onClick">
        <div :style="style" class='image-list' ref="imageList">
            <CollectionImage v-for="image of props.collection.images" :id="image.id" :width="image.width ?? 0"
                :height="image.height ?? 0" :src="image.path" />
        </div>
    </div>
</template>

<script setup lang="ts">

import CollectionImage from '@/components/collection2/CollectionImage.vue'

//TODO tween is overkill here
import { StyleValue, computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { CollectionWithImages } from '@/model/Data'
import { grid } from '@/hooks/grid'
import { useCollectionViewer } from '@/hooks/useCollectionViewer'
import { Navigator } from '@/Navigator'

const props = defineProps<{ collection: CollectionWithImages }>()

const container = ref<HTMLDivElement>()

const imageList = ref<HTMLDivElement>()

const collectionViewer = useCollectionViewer()

const style = computed<StyleValue>(() => {
    const columns = Math.ceil(Math.sqrt(props.collection.images.length))
    return grid(columns, collectionViewer.orientation)
})

function onClick(e: MouseEvent) {
    e.stopPropagation()
    collectionViewer.select()
}

let navigator: Navigator

onMounted(() => {
    navigator = new Navigator(container.value!, imageList.value!)
})

onBeforeUnmount(() => navigator.destroy())

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