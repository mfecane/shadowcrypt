
<template>
    <Transition>
        <span v-if="error" class="error">{{ error }}</span>
    </Transition>
    <Transition>
        <span v-if="message" class="message">{{ message }}</span>
    </Transition>
</template>
  
<script setup lang="ts">

const { error, message } = defineProps<{ error?: string, message?: string }>()

</script>
  
<style scoped lang="scss">
.error {
    height: 30px;
    font-weight: 500;
    color: var(--color-delete);
}

.message {
    height: 30px;
    font-weight: 500;
    color: var(--color-ok);
}


.v-enter-active,
.v-leave-active {
    transition: height 0.2s ease;
}

.v-enter-from,
.v-leave-to {
    height: 0;
}
</style>
