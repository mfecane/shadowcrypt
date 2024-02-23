
<template>
    <dialog class="confirmation-dialog" ref="dialogRef" @close="visible = false">
        <form @submit.prevent="$emit('ok')" v-if="visible" method="dialog">
            <p class="confirmation-text">Delete item?</p>
            <div class="buttons">
                <button class="btn" type="submit" @click="onOk">Ok</button>
                <button class="btn" type="reset" @click="dialogRef?.close()">Cancel</button>
            </div>
        </form>
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
};

defineExpose({
    showModal: showModal,
})

function onOk() {
    emits('ok')
    dialogRef.value?.close()
    visible.value = true
}

</script>
  
<style scoped lang="scss">
.confirmation-dialog {
    position: fixed;
    z-index: 2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.5);

    background-color: var(--color-light3);
    border-radius: 6px;
    padding: 24px;

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.3);
    }
}

.confirmation-text {
    margin-bottom: 24px;
}

.buttons {
    display: flex;

    & *:first-child {
        margin-right: 16px;
    }
}
</style>
