<template>
    <dialog v-if="show" class="confirmation-dialog" ref="dialogRef" @close="onClose">
        <form @submit.prevent="onOk" method="dialog">
            <p class="confirmation-text">
                <slot></slot>
            </p>
            <div class="buttons">
                <button class="btn" type="submit">Ok</button>
                <button class="btn" type="reset" @click="onClose">Cancel</button>
            </div>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const show = defineModel<boolean>()

const dialogRef = ref<HTMLDialogElement>()

const emits = defineEmits<{ (e: 'ok'): void, (e: 'cancel'): void }>()

watch([show, dialogRef], ([show, dialogRef]) => {
    if (show && dialogRef) {
        dialogRef.showModal()
    }
    if (!show && dialogRef) {
        dialogRef.close()
    }
})

function onOk() {
    emits('ok')
    dialogRef.value?.close()
    show.value = true
}

function onClose() {
    emits('cancel')
    show.value = false
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
