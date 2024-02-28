
<template>
    <form class="login_form" @submit.prevent="onSubmit">
        <span v-if="auth.error" class="error">{{ auth.error }}</span>
        <p>Enter email Lorem, ipsum dolor sit amet consectetur adipisicing elit. Possimus quibusdam ratione culpa!...</p>
        <label for="email">E-mail</label>
        <input type="email" id="email" class="input_text" v-model="email" />
        <button type="submit" class="btn input" :disabled="locked">Submit</button>
    </form>
</template>
  
<script setup lang="ts">

import { ref } from 'vue'

import { useAuth, login } from '@/hooks/useAuth';
import { sleep } from '@/utils/utils'

const auth = useAuth()

const email = ref('')
const password = ref('')
const locked = ref(false)

async function onSubmit() {
    locked.value = true
    try {
        await login(email.value, password.value)
    } catch (e) {
        await sleep(500)
        //@ts-expect-error
        auth.setError(e.toString())
        locked.value = false
    }
}

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
