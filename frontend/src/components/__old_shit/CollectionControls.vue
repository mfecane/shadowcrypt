<template>
  <div class='controls'>
    <CCheckbox :label="'More ideas'" />
    <CCheckbox :label="'Single row'" />
  </div>
</template>

<script setup lang="ts">
import CCheckbox from '@/components/CCheckbox.vue'
</script>

<style scoped lang="scss">
.controls {
  width: 320px;
  display: flex;
  justify-content: space-between;
  margin: 8px auto 16px auto;
}
</style>