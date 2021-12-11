<template>
  <FirstRow :collections="collections2.collections.slice(0, 3)" />
  <MainGrid :collections="collections2.collections.slice(3)" />
</template>

<script setup lang="ts">
import FirstRow from '@/ts/components/FirstRow.vue'
import MainGrid from '@/ts/components/MainGrid.vue'
import { useCollections2 } from '../hooks/useCollections2';
import { onMounted } from 'vue';

const collections2 = useCollections2()

onMounted(() => {
  collections2.load()
})
</script>
