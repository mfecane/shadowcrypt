
<template>
    <div v-if="auth.user" class="user" v-click-outside-element="closeOptions">
        <a href="#" @click.prevent="showMenu = true">
            <img :src="gravatar" alt="" />
        </a>
        <UserMenu v-if="showMenu" @onClose="showMenu = false" />
    </div>
    <div class="user2" v-else>
        <button class="btn" @click="auth.showLoginDialog">Login</button>
        <button class="btn" @click="auth.showRegisterDialog">Register</button>
    </div>
</template>
  
<script setup lang="ts">

import UserMenu from './UserMenu.vue'

import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia';
import md5 from 'md5'

import { useAuth } from '@/ts/hooks/useAuth'

const auth = useAuth()

const { user } = storeToRefs(auth)

const showMenu = ref<boolean>(false)

onMounted(() => showMenu.value = false)

const gravatar = computed(() => {
    const hash = md5(user.value!.email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}`;
})

function closeOptions() {
    showMenu.value = false
}

</script>
  
<style scoped lang="scss">
.user2 {
    display: flex;

    &>* {
        margin-left: 8px;

    }
}

.user {
    position: relative;

    a {
        display: block;
        border-radius: 6px;
        border: 2px solid black;
        width: 64px;
        height: 64px;

        img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            border: 2px solid var(--color-light);
        }
    }
}
</style>
