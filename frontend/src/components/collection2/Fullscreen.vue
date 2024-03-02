<template>
    <div class="fullscreen" @click="onAnything" @pointermove="onAnything" @touchmove="onAnything">
        <Transition>
            <img v-if="fullScreen" :src="image.path" :class="fitClass" />
        </Transition>
    </div>
</template>

<script setup lang="ts">

import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useCollectionViewer } from '@/hooks/useCollectionViewer';
import { CollectionImage } from '@/model/Data';

const collectionViewer = useCollectionViewer()

const { fullScreen } = storeToRefs(collectionViewer)

const { images } = storeToRefs(useCollectionViewer())

const image = computed(() => {
    return images.value.find(it => it.id === fullScreen.value!) as CollectionImage
})

const fitClass = computed<string>(() => {
    const aspect = image.value.width! / image.value.height!
    return aspect > window.innerWidth / window.innerHeight ? 'fit-horizontally' : 'fit-vertically '
})

function onAnything(event: Event) {
    event.preventDefault()
    collectionViewer.closeFullscreen()
}

</script>
  
<style scoped lang="scss">
.fullscreen {
    display: none;
    pointer-events: none;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
    z-index: 3;
    background: rgba(0, 0, 0, 0.6);
    overflow: hidden;

    align-items: center;
    justify-content: center;
}

.fullscreen img {
    border-radius: 5px;
    // TODO use calc
    transform: scale(0.95);
    border: 1px solid black;
    box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.6);
}

.fullscreen:has(img) {
    display: flex;
    pointer-events: all;
}

.fit-horizontally {
    width: 100%;
}

.fit-vertically {
    height: 100%;
}

.fullscreen img.v-enter-active {
    transition: transform 0.2s cubic-bezier(.03, 1.1, .77, 1.1);
}

.fullscreen img.v-leave-active {
    transition: transform 0.2s ease-in;
}

.fullscreen img.v-enter-from,
.fullscreen img.v-leave-to {
    transform: scale(0);
}
</style>