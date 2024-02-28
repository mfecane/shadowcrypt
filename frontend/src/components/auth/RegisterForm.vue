
<template>
    <form class="login_form" @submit.prevent="onSubmit">
        <button class="btn input signup-google" @click.prevent="noop">
            <Icon :type="IconType.google" />
            Sign up with google
        </button>
        <h2 class="or">OR</h2>
        <span v-if="auth.error" class="error">{{ auth.error }}</span>
        <label for="login">E-mail</label>
        <input type="email" id="login" class="input_text" v-model="login" />
        <label for="login">Password</label>
        <input type="password" id="password" class="input_text" v-model="password" />
        <label for="password_confirm">Confirm password</label>
        <input type="password" id="password_confirm" class="input_text " v-model="confirmation" />
        <button type="submit" class="btn input" :disabled="locked">Sign up</button>
    </form>
</template>
  
<script setup lang="ts">

import { ref } from 'vue'

import Icon from '@/components/common/icons/Icon.vue'

import { IconType } from '@/components/common/icons/IconType'
import { useAuth, register } from '@/hooks/useAuth';
import { sleep } from '@/utils/utils'

const auth = useAuth()

const login = ref('')
const password = ref('')
const confirmation = ref('')
const locked = ref(false)

async function onSubmit() {
    locked.value = true
    try {
        await register(login.value, password.value, confirmation.value)
    } catch (e) {
        await sleep(500)
        //@ts-expect-error
        auth.setError(e.toString())
        locked.value = false
    }
}

function noop() { }

</script>
  
<style scoped lang="scss">
.login_form {
    display: flex;
    flex-direction: column;
    align-items: stretch;

    &>*:not(:last-child) {
        margin-bottom: 16px;
    }
}

.signup-google {
    display: flex;

    &>:deep(*:first-child) {
        margin-right: 6px;
    }

    :deep(.icon) path {
        fill: black;
    }
}

.or {
    align-self: center;
    font-size: 1.2rem;
}

.error {
    color: var(--color-delete);
}

button.input {
    margin-top: 12px;
}
</style>
