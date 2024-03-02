<template>
    <div class="register-container">
        <Logo size="small" />
        <h1>
            User settings
        </h1>
        <UserSettings />
    </div>
</template>
  
<script setup lang="ts">

import UserSettings from '@/components/auth/UserSettings.vue';
import Logo from '../common/Logo.vue';

</script>
  
<style scoped lang="scss">
h1 {
    margin-top: 18px;
    font-size: 3rem;
    margin-bottom: 18px;
}

.register-container {
    max-width: 600px;
    margin: auto;
    padding: 42px 20px;
    color: var(--accent-color);
    display: flex;
    flex-direction: column;
}
</style>
