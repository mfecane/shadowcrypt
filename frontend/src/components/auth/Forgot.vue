<template>
    <Dialog2 ref="dialog">
        <form v-if="dialogType === LoginDialogType.Forgot" action="dialog" class="login_form">
            <label for="email">Email</label>
            <input type="text" id="email" class="input_text " />
            <div class="buttons">
                <button typer="submit" class="btn">Register</button>
                <button class="btn" @click.prevent="auth.closeDialog">Cancel</button>
            </div>
        </form>
    </Dialog2>
</template>
  
<script setup lang="ts">

import Dialog2 from '@/components/auth/Dialog2.vue'

import { LoginDialogType, useAuth } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue'

const auth = useAuth()
const { dialogType } = storeToRefs(auth)

const dialog = ref()

watch(dialogType, (show) => {
    if (dialogType.value === LoginDialogType.Forgot) {
        dialog.value?.showModal()
    } else {
        dialog.value?.close()
    }
}, { immediate: true })

</script>
  
<style scoped lang="scss">
.buttons {
    display: flex;

    &>*:first-child {
        margin-right: 20px;
    }
}

.login_form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 20px;

    &>*:not(:last-child) {
        margin-bottom: 20px;
    }
}
</style>
