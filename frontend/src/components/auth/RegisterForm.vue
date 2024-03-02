<template>
    <form class="login_form" @submit.prevent="onSubmit">
        <GluGlu />
        <h2 class="or">OR</h2>
        <AuthMessage :error="error" :message="message" />
        <label for="login">E-mail</label>
        <input type="email" id="login" class="input_text" v-model="login" />
        <label for="password">Password</label>
        <input type="password" id="password" class="input_text" v-model="password" />
        <label for="password_confirm">Confirm password</label>
        <input type="password" id="password_confirm" class="input_text " v-model="confirmation" />
        <button type="submit" class="btn input" :disabled="locked">Sign up</button>
    </form>
</template>

<script setup lang="ts">

import AuthMessage from './AuthMessage.vue';
import GluGlu from './GluGlu.vue';

import { onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

import { useAuth, register } from '@/hooks/useAuth';

const auth = useAuth()

const router = useRouter()

const { locked, error, message } = storeToRefs(auth)

const login = ref('')
const password = ref('')
const confirmation = ref('')

async function onSubmit() {
    if (await register(login.value, password.value, confirmation.value)) {
        router.push('/signin')
    }
}

onBeforeUnmount(() => {
    auth.clearMessages()
})
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
