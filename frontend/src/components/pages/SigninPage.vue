<template>
    <AuthPage>
        <template v-slot:header>Sign in</template>
        <SigninForm v-slot:default />
        <template v-slot:haveAccount>
            <span>Do not have an account?</span>
            <router-link class="btn alt" to="/signup">Sign up</router-link>
        </template>
    </AuthPage>
</template>
  
<script setup lang="ts">

import SigninForm from '../auth/SigninForm.vue';
import AuthPage from './AuthPage.vue';

</script>
  
<style scoped lang="scss"></style>
