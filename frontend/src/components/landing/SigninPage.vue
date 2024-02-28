<template>
    <div class="register-container">
        <h1>Sign in</h1>
        <SigninForm />
        <div class="have-account">
            <span>Do not have an account?</span>
            <router-link class="btn" to="/signup">Sign up</router-link>
        </div>
    </div>
</template>
  
<script setup lang="ts">

import SigninForm from '../auth/SigninForm.vue';

</script>
  
<style scoped lang="scss">
h1 {
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

.have-account {
    margin-top: 20px;
    display: flex;
    align-self: center;
    align-items: center;

    &>*:first-child {
        margin-right: 10px;
    }
}
</style>
