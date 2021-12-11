<template>
  <div className='upper-grid'>
    <CollectionThumbnail v-for="(collection, index) in props.collections" :collection="collection" :key="index"
      :index="index" />
  </div>
</template>

<script setup lang="ts">
import CollectionThumbnail from '@/ts/components/CollectionThumbnail.vue'
import { CollectionWithImages } from '../model/Data';

const props = defineProps<{ collections: CollectionWithImages[] }>()
</script>

<style scoped lang="scss">
.upper-grid {
  display: grid;
  grid-template-columns: 3fr 2fr 2fr;
  grid-template-rows: 380px;
  gap: 32px;
  margin: 16px 0px 32px 0;
}
</style>