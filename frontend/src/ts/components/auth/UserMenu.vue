
<template>
    <div class="user-menu visible">
        <span class="user-name">{{ user!.name || user!.email }}</span>
        <ul>
            <li>
                <a href="#" class="light" @click.prevent="">Settings</a>
            </li>
            <li>
                <button class="btn logout0button light" @click="onLogoutClick">LogOut</button>
            </li>
        </ul>
    </div>
</template>
  
<script setup lang="ts">

import { logout, useAuth } from '@/ts/hooks/useAuth';
import { storeToRefs } from 'pinia';

const auth = useAuth()

const { user } = storeToRefs(auth)

const emits = defineEmits<{
    (e: 'onClose'): void
}>()

function onLogoutClick() {
    emits('onClose')
    logout()
}

</script>
  
<style scoped lang="scss">
.user-menu {
    position: absolute;
    top: 68px;
    right: 0;
    background-color: var(--color-light3);
    display: none;
    flex-direction: column;
    z-index: 3;
    border-radius: 4px;
    padding: 22px 28px;
    min-width: 200px;
    color: var(--bg-color);

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
