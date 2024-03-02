
<template>
    <div class="user-menu visible">
        <span class="user-name">{{ user!.name || user!.email }}</span>
        <ul>
            <li>
                <router-link to="/user" class="light" @click.prevent="">Settings</router-link>
            </li>
            <li>
                <button class="btn black" @click="onLogoutClick">Log Out</button>
            </li>
        </ul>
    </div>
</template>
  
<script setup lang="ts">

import { logout, useAuth } from '@/hooks/useAuth';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const auth = useAuth()
const router = useRouter()

const { user } = storeToRefs(auth)

const emits = defineEmits<{
    (e: 'onClose'): void
}>()

async function onLogoutClick() {
    emits('onClose')
    await logout()
    router.push('/landing')
}

</script>
  
<style scoped lang="scss">
.user-menu {
    position: absolute;
    top: 68px;
    right: 0;
    background-color: var(--accent-color);
    display: none;
    flex-direction: column;
    z-index: 3;
    border-radius: 12px;
    padding: 22px 28px;
    min-width: 200px;
    color: var(--color-dark);
    box-shadow: 1px 1px 10px 0px rgba(0, 0, 0, 0.3);

    &.visible {
        display: flex;
    }

    & *:not(:last-child) {
        margin-bottom: 16px;
    }
}

.user-menu ul {
    display: flex;
    flex-direction: column;
}

.logout0button {
    width: 100%;
}

.user-name {
    display: block;
    margin-bottom: 24px !important;
    font-weight: 500;
}
</style>
