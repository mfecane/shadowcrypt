
<template>
    <div class="image-container">
        <img v-if="filename" :src="filename" />
    </div>
</template>
  
<script setup lang="ts">
import { ref, watch } from 'vue';
import { getTmpImageSource } from '@/api/images';

const props = defineProps<{ id: string }>()

const filename = ref<string | null>(null)

watch(() => props.id, async (id) => {
    filename.value = await getTmpImageSource(id)
}, { immediate: true })

</script>
  
<style scoped lang="scss">
.image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;

    & img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
    }
}
</style>
