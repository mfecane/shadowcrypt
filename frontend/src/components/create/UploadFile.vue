<template>
    <div v-if="uploadStore.imageId" class="image2">
        <CollectionImage2 :id="uploadStore.imageId" />
        <IconButton :type="IconType.cross" class="discard" @click="discardTmpImage2" :size="1.25" />
    </div>
    <template v-else>
        <label for="filename">Input file name</label>
        <input id="filename" type="text" class="add" v-model.trim="filename" @change="onChangeDebounce" />
        <p>or</p>
        <div class="drag" @drop.prevent="onDrop" @dragenter.prevent="noop" @dragover.prevent="noop"
            @dragleave.prevent="noop">Drag image here</div>
    </template>
</template>

<script setup lang="ts">

import IconButton from '@/components/common/inputs/IconButton.vue'

import { debounce } from 'lodash'
import { onMounted, ref } from 'vue'

import CollectionImage2 from './CollectionImage2.vue'
import { checkClipboard, useUploadDialog, discardTmpImage2 } from '@/hooks/useUploadDialog'
import { IconType } from '../common/icons/IconType'
import { createTmpImageFromUrl, uploadFile } from '@/api/images'
import { useAuth } from '@/hooks/useAuth'

const filename = ref('')
const uploadStore = useUploadDialog()
const auth = useAuth()

async function onChange() {
    try {
        // TODOOO OPTIMIZE!!!
        uploadStore.setImageId(await createTmpImageFromUrl(filename.value))
    } catch (error) {
        console.log('uploading image failed')
    }
}

const onChangeDebounce = debounce(onChange, 500)

function noop() { }

async function onDrop(event: DragEvent): Promise<void> {
    let files = event.dataTransfer?.files
    if (!files) {
        return
    }
    const file = (Array.from(files))[0]
    try {
        if (!auth.user) {
            return
        }
        uploadStore.setImageId(await uploadFile(auth.user.id, file))
    } catch (error) {
        console.log('uploading image failed')
    }
}

onMounted(() => checkClipboard())

</script>

<style scoped lang="scss">
#filename {
    border: 1px solid black;
    padding: 12px;
    border-radius: 4px;
}

.image2 {
    position: relative;
    flex: 1 1 auto;
    overflow: hidden;
}

.discard {
    position: absolute;
    top: 12px;
    right: 12px;

    width: 32px;
    height: 32px;

    background-color: white;
    border-radius: 16px;

    & :deep(svg rect),
    & :deep(svg path) {
        fill: var(--color-delete);
        transition: fill 200ms ease;
    }
}

.inputs {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;

    & *:not(:last-child) {
        margin-bottom: 6px;
    }
}

.drag {
    flex: 1 1 auto !important;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 20px;
    text-align: center;
    border-radius: 4px;
    border: 1px dashed black;
    background-color: rgb(239, 239, 239);
    font-size: 16px;
    color: rgb(138, 155, 155);
    font-weight: 500;
}
</style>