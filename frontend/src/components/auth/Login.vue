
<template>
    <Dialog2 ref="dialog">
        <form v-if="dialogType === LoginDialogType.Login" action="dialog" class="login_form" @submit.prevent="onSubmit">
            <label for="login">Login</label>
            <input type="text" id="login" class="input_text" ref="login" />
            <label for="login">Password</label>
            <input type="password" id="password" class="input_text" ref="password" />
            <a class="light" @click.prevent="auth.showForgotDialig">Forgot password</a>
            <div class="buttons">
                <button class="btn light" type="submit">Login</button>
                <button class="btn light" @click.prevent="auth.closeDialog">Cancel</button>
            </div>
        </form>
    </Dialog2>
</template>
  
<script setup lang="ts">

import Dialog2 from '@/components/auth/Dialog2.vue'

import { LoginDialogType, login as login2, useAuth } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue'

const auth = useAuth()
const login = ref()
const password = ref()
const { dialogType } = storeToRefs(auth)

const dialog = ref()

watch(dialogType, (show) => {
    if (dialogType.value === LoginDialogType.Login) {
        dialog.value?.showModal()
    } else {
        dialog.value?.close()
    }
}, { immediate: true })

async function onSubmit() {
    await login2(login.value.value, password.value.value)
}

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
