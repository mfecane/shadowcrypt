<template>
    <div class="register-container">
        <h1>
            <slot name="header"></slot>
        </h1>
        <slot></slot>
        <div class="have-account">
            <slot name="haveAccount"></slot>
        </div>
    </div>
</template>
  
<script setup lang="ts">
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

    &>:deep(*:first-child) {
        margin-right: 10px;
    }
}
</style>
