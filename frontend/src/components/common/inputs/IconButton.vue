
<template>
    <button class="icon_button" @click.prevent="$emit('click')">
        <Icon :type="props.type" :size="props.size" />
    </button>
</template>
  
<script setup lang="ts">
import { IconType } from '../icons/IconType';
import Icon from '../icons/Icon.vue'

const emits = defineEmits<{
    (e: 'click'): void
}>()

const props = withDefaults(defineProps<{ type: IconType, size?: number }>(), {
    size: 2
})

</script>
  
<style scoped lang="scss">
.icon_button {
    background-color: transparent;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px 5px;
}

.icon_button :deep(svg rect),
.icon_button :deep(svg path) {
    fill: var(--color-light2);
    transition: fill 200ms ease;
}

.icon_button:hover :deep(svg rect),
.icon_button:hover :deep(svg path) {
    fill: var(--accent-color-light);
}

.icon_button:disabled :deep(svg rect),
.icon_button:disabled :deep(svg path) {
    fill: var(--color-neutral);
}
</style>
