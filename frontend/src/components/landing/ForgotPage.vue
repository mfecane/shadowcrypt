<template>
    <AuthPage>
        <template v-slot:header>Forgot password</template>
        <ForgotForm v-slot:default />
        <template v-slot:haveAccount>
            <span>Changed your mind? Try to sign in instead.</span>
            <router-link class="btn" to="/signin">Sign in</router-link>
        </template>
    </AuthPage>
</template>
  
<script setup lang="ts">

import AuthPage from '@/components/landing/AuthPage.vue'
import ForgotForm from '@/components/auth/ForgotForm.vue'

</script>
  
<style scoped lang="scss"></style>
