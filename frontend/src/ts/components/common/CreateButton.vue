<template>
    <button class="create-button">
        <IconPlus color="red" @click.prevent="$emit('click')" />
    </button>
</template>

<script setup lang="ts">
import IconPlus from '@/ts/components/common/icons/IconPlus.vue'
const emits = defineEmits<{
    (e: 'click'): void
}>()
</script>

<style scoped lang="scss">
.create-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 6px;
    padding: 10px;
    box-shadow: 2px 2px 8px #00000050, 1px 1px 2px #00000050;
}
</style>