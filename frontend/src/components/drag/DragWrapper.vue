
<template>
    <div class="drag-wrapper" :class="{ 'lock-children': dragging }" @drop.prevent="onDrop" @dragenter.prevent="onDragEnter"
        @dragover.prevent="noop" @dragleave.prevent="onDragLeave">
        <slot></slot>
        <Transition>
            <div class="drag-target" v-show="dragging">
                <div> DROP IMAGE TO UPLOAD </div>
            </div>
        </Transition>
    </div>
</template>
  
<script setup lang="ts">
import { useUploadDialog } from '@/hooks/useUploadDialog';
import { uploadFile } from '@/api/loader';
import { ref } from 'vue'

const dragging = ref<boolean>(false)
const store = useUploadDialog()

// flag lets us await for lock class to take effect
const enableDragInteractions = ref<boolean>(false)

async function onDragEnter(event: DragEvent): Promise<void> {
    dragging.value = true

    // TODO try nextTick
    await new Promise(resolve => setTimeout(resolve, 300))
    enableDragInteractions.value = true
}

// function onDragOver() {
//     if (!enableDragInteractions.value) {
//         return
//     }

//     dragging.value = true
// }

function onDragLeave() {
    if (!enableDragInteractions.value) {
        return
    }

    dragging.value = false
    enableDragInteractions.value = false
}

// TODO add loaders
async function onDrop(event: DragEvent) {
    if (!dragging.value) {
        return
    }

    let files = event.dataTransfer?.files
    if (!files?.length) {
        dragging.value = false
        return
    }

    const file = (Array.from(files))[0]

    try {
        const fileId = await uploadFile(file)
        store.showCreateDialog()
        store.setImageId(fileId)
    } catch (error) {
        console.log('uploading image failed')
    }
    dragging.value = false
}

function noop() { }

</script>
  
<style scoped lang="scss">
.drag-wrapper {
    min-height: 100vh;
    position: relative;
    z-index: 1;

    &.lock-children :deep(*) {
        pointer-events: none;
    }
}

.drag-target {
    pointer-events: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.8);
    font-size: 2rem;
}

.drag-target>div {
    position: absolute;
    top: 20%;
    left: 20%;
    right: 20%;
    bottom: 20%;

    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    border: 1px dashed white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.v-enter-active,
.v-leave-active {
    transition: opacity 0.3s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}
</style>
