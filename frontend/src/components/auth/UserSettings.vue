
<template>
    <form class="login_form" @submit.prevent="onSubmit">
        <AuthMessage :error="error" :message="message" />
        <div class="pass">
            <label for="login">E-mail</label>
            <a href="https://gravatar.com/" target="_blank" class="user-dick-pic">
                <img :src="gravatar" alt="" />
            </a>
            <input type="email" id="login" class="input_text" v-model="email" readonly />
        </div>
        <label for="name">Username</label>
        <input type="text" id="name" class="input_text" v-model="name" />
        <label for="password">New password</label>
        <input type="password" id="password" class="input_text" v-model="password" />
        <label for="confirmPassword">Confirm new password</label>
        <input type="password" id="confirmPassword" class="input_text" v-model="confirmPassword" />
        <button type="submit" class="btn input" :disabled="locked">Update</button>
    </form>
</template>
  
<script setup lang="ts">

import AuthMessage from './AuthMessage.vue';

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import md5 from 'md5';
import { storeToRefs } from 'pinia';

import { useAuth, updatePassword2, updateUser } from '@/hooks/useAuth';

const auth = useAuth()

const { user, locked, error, message } = storeToRefs(auth)

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const gravatar = computed(() => {
    if (user.value) {
        const hash = md5(user.value.email.trim().toLowerCase());
        return `https://www.gravatar.com/avatar/${hash}`;
    }
    return 'http://www.gravatar.com/avatar'
})

watch(user, (user) => {
    name.value = user?.name ?? ''
    email.value = user?.email ?? ''
}, { immediate: true })

function onSubmit() {
    if (password.value) {
        if (password.value != confirmPassword.value) {
            auth.setError('Passwords do jnot match')
            return
        }
        return updatePassword2(password.value)
    }
    if (name.value && name.value !== user.value?.name) {
        return updateUser(name.value)
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

button.input {
    margin-top: 12px;
}

.pass {
    display: grid;
    grid-template-columns: 1fr 80px;
    column-gap: 16px;
}

.user-dick-pic {
    grid-row-end: span 2;

    img {
        width: 80px;
        height: 80px;
        border-radius: 40px;
    }
}
</style>