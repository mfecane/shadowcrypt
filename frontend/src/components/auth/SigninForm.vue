
<template>
    <form class="login_form" @submit.prevent="onSubmit">
        <button class="btn input signup-google" @click.prevent="noop">
            <Icon :type="IconType.google" />
            Sign in with google
        </button>
        <h2 class="or">OR</h2>
        <span v-if="auth.error" class="error">{{ auth.error }}</span>
        <label for="login">E-mail</label>
        <input type="email" id="login" class="input_text" v-model="email" />
        <label for="login">Password</label>
        <input type="password" id="password" class="input_text" v-model="password" />
        <p>Forgot your password? <router-link to="/forgot">Click here</router-link></p>
        <button type="submit" class="btn input" :disabled="locked">Sign in</button>
    </form>
</template>
  
<script setup lang="ts">

import { ref } from 'vue'

import Icon from '@/components/common/icons/Icon.vue'

import { IconType } from '@/components/common/icons/IconType'
import { useAuth, login } from '@/hooks/useAuth';
import { sleep } from '@/utils/utils'

import { useRouter } from 'vue-router'

const router = useRouter()

const auth = useAuth()

const email = ref('')
const password = ref('')
const locked = ref(false)

async function onSubmit() {
    locked.value = true
    try {
        await login(email.value, password.value)
        router.push('/list')
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
