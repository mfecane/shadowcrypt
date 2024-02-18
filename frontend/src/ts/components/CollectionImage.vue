<template>
    <div class='image-container' :class="ratioClass">
        <img :src="props.src" class='image' />
    </div>
</template>


<script setup lang="ts">

const props = defineProps<{ width: number, height: number, src: string }>()

let ratio = props.height / props.width
let ratioClass = ''

if (ratio <= 0.5) {
    ratioClass = 'image-container-1'
} else if (ratio < 1.0) {
    ratioClass = 'image-container-2'
} else if (ratio < 1.5) {
    ratioClass = 'image-container-3'
} else {
    ratioClass = 'image-container-4'
}
</script>
  
<style scoped lang="scss">
.image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-container {
    padding: 5px;
    border-radius: 3px;
    background-color: var(--bg-color-dark);
    box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.2);
    min-height: 0;
    position: relative;
}

.image-container-1 {
    grid-row-start: span 1;
}

.image-container-2 {
    grid-row-start: span 2;
}

.image-container-3 {
    grid-row-start: span 3;
}

.image-container-4 {
    grid-row-start: span 4;
}
</style>