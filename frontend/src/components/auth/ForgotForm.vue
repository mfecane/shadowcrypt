
<template>
    <form class="login_form" @submit.prevent="onSubmit">
        <AuthMessage :error="error" :message="message" />
        <p>Enter your email. We will send a recovery link.</p>
        <label for="email">E-mail</label>
        <input type="email" id="email" class="input_text" v-model="email" />
        <button type="submit" class="btn input" :disabled="locked">Submit</button>
    </form>
</template>
  
<script setup lang="ts">

import AuthMessage from './AuthMessage.vue';

import { onBeforeUnmount, ref } from 'vue'

import { useAuth, sendEmail } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const auth = useAuth()

const { error, message, locked } = storeToRefs(auth)

const email = ref('')

const router = useRouter()

async function onSubmit() {
    await sendEmail(email.value)
    router.push('/signin')
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

button.input {
    margin-top: 12px;
}
</style>
