
<template>
    <Dialog2 ref="dialog">
        <form v-if="dialogType === LoginDialogType.Register" action="dialog" class="login_form" @submit.prevent="onSubmit">
            <span v-if="auth.error">{{ auth.error }}</span>
            <label for="login">Login</label>
            <input type="text" id="login" class="input_text" v-model="login" />
            <label for="login">Password</label>
            <input type="password" id="password" class="input_text" v-model="password" />
            <label for="password_confirm">Confirm password</label>
            <input type="password" id="password_confirm" class="input_text " v-model="confirmation" />
            <div class="buttons">
                <button typer="submit" class="btn">Register</button>
                <button class="btn" @click.prevent="auth.closeDialog">Cancel</button>
            </div>
        </form>
    </Dialog2>
</template>
  
<script setup lang="ts">

import Dialog2 from '@/components/auth/Dialog2.vue'

import { LoginDialogType, useAuth, register } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue'

const auth = useAuth()
const { dialogType } = storeToRefs(auth)

const dialog = ref()
const login = ref('')
const password = ref('')
const confirmation = ref('')

watch(dialogType, (show) => {
    if (dialogType.value === LoginDialogType.Register) {
        dialog.value?.showModal()
    } else {
        dialog.value?.close()
    }
}, { immediate: true })

async function onSubmit() {
    try {
        await register(login.value, password.value, confirmation.value)
    } catch (e) {
        //@ts-expect-error
        auth.setError(e.toString())
    }
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
