
<template>
    <dialog class="dialog" ref="dialogRef" @close="visible = false">
        <slot v-if="visible"></slot>
    </dialog>
</template>
  
<script setup lang="ts">

import { ref } from 'vue'

const dialogRef = ref<HTMLDialogElement>()

const emits = defineEmits<{ (e: 'ok'): void }>()

const visible = ref(false)

const showModal = () => {
    dialogRef.value?.showModal()
    visible.value = true
}

const close = () => {
    dialogRef.value?.close()
    visible.value = false
}

defineExpose({
    showModal: showModal,
    close: close,
})

</script>
  
<style scoped lang="scss">
.dialog {
    position: fixed;
    z-index: 2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    min-width: 500px;

    box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.5);

    background-color: var(--color-light3);
    border-radius: 6px;
    padding: 24px;

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.3);
    }
}
</style>
