
<template>
    <div v-if="auth.user" class="user" v-click-outside-element="closeOptions">
        <a href="#" @click.prevent="showMenu = true">
            <img :src="gravatar" alt="" />
            <Icon :type="IconType.back" :size="1.2" />
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
import Icon from '@/components/common/icons/Icon.vue'

import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia';
import md5 from 'md5'

import { useAuth } from '@/hooks/useAuth'
import { IconType } from '../common/icons/IconType';

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
        display: flex;
        border-radius: 12px;
        background-color: black;
        height: 56px;
        align-items: center;
        padding: 4px;

        img {
            width: 48px;
            height: 48px;
            object-fit: cover;
            border-radius: 10px;
            border: 2px solid var(--color-light);
        }

        :deep(svg) {
            transform: rotate(-90deg);
            margin: 8px 8px 8px 12px;

            path {
                fill: var(--color-light2)
            }
        }

        &:hover :deep(svg) {
            path {
                fill: var(--accent-color)
            }
        }
    }
}
</style>
