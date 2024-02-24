<template>
  <div>
    <p>https://i.pinimg.com/564x/96/f9/d0/96f9d007682441d88578af4df42b32f8.jpg</p>
    <form @submit.prevent="onSubmit">
      <input type="text" v-model="url" />
      <button type="submit">Upload</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { loadImage } from '@/loader'

// TODO remove

const url = defineModel<string>({ default: 'https://i.pinimg.com/564x/96/f9/d0/96f9d007682441d88578af4df42b32f8.jpg' })

function onSubmit() {
  loadImage(url.value)
}

</script>

<style scoped lang="scss">
input[type="text"] {
  border-radius: 5px;
  width: 300px;
  height: 20px;
  font-size: 16px;
}
</style>