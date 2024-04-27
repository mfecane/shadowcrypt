<template>
    <AuthPage>
        <template v-slot:header>Get started</template>
        <RegisterForm v-slot:default />
        <template v-slot:haveAccount>
            <span>Already have an account?</span>
            <router-link class="btn alt" to="/signin">Sign in</router-link>
        </template>
    </AuthPage>
</template>
  
<script setup lang="ts">
import RegisterForm from '../auth/RegisterForm.vue';
import AuthPage from './AuthPage.vue';
</script>
  
<style scoped lang="scss"></style>
