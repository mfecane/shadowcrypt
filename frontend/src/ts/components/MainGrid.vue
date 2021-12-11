<template >
  <div class="main-grid">
    <CollectionThumbnail v-for="(collection, index) in props.collections" :collection="collection" :key="index"
      :index="index" />
  </div>
</template>

<script lang="ts" setup>
import CollectionThumbnail from '@/ts/components/CollectionThumbnail.vue'
import { CollectionWithImages } from '../model/Data';

const props = defineProps<{ collections: CollectionWithImages[] }>()
</script>

<style scoped lang="scss">
.main-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: 300px;
  gap: 24px;
  margin-bottom: 100px;
}
</style>