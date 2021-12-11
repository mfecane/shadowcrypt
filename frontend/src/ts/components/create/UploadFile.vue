
<template>
    <div v-if="uploadStore.imageId">
        <CollectionImage2 :id="uploadStore.imageId" />
        <button @click="discard">Discard</button>
    </div>
    <div v-else>
        <label for="filename"></label>Input file name
        <input id="filename" type="text" class="add" v-model.trim="filename" @change="onChangeDebounce" />
        <p>or</p>
        <div class="drag" @drop.prevent="onDrop" @dragenter.prevent="noop" @dragover.prevent="noop"
            @dragleave.prevent="noop">Drag image here</div>
    </div>
</template>
  
<script setup lang="ts">

import { tryLoadImage, discardLoadImage, uploadFile } from '@/ts/api/loader';
import { debounce } from 'lodash';
import { ref } from 'vue'
import CollectionImage2 from './CollectionImage2.vue';
import { useUploadDialog } from '@/ts/hooks/useUploadDialog';

const filename = ref('')
const uploadStore = useUploadDialog()

async function onChange() {
    try {
        uploadStore.setImageId(await tryLoadImage(filename.value))
    } catch (error) {
        console.log('uploading image failed')
    }
}

const onChangeDebounce = debounce(onChange, 500)


async function discard() {
    if (uploadStore.imageId) {
        await discardLoadImage(uploadStore.imageId)
        uploadStore.setImageId(null)
    }
}

function noop() { }

async function onDrop(event: DragEvent): Promise<void> {
    let files = event.dataTransfer?.files
    if (!files) {
        return
    }
    const file = (Array.from(files))[0]
    try {
        uploadStore.setImageId(await uploadFile(file))
    } catch (error) {
        console.log('uploading image failed')
    }
}

</script>
  
<style scoped lang="scss">
#filename {
    border: 1px solid black;
    padding: 12px;
    border-radius: 4px;
}

.drag {
    padding: 40px 20px;
    text-align: center;
    border-radius: 4px;
    border: 1px dashed black;
    background-color: rgb(210, 220, 220);
    font-size: 12px;
    color: rgb(138, 155, 155);
    font-weight: 700;
}
</style>
