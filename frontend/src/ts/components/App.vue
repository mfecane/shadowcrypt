<template >
  <DragWrapper>
    <div className='content'>
      <div className='container'>
        <router-view />
      </div>
    </div>
    <CreateButton />
  </DragWrapper>
  <Create />
</template>

<script lang="ts" setup>

import Create from '@/ts/components/create/Create.vue'
import CreateButton from '@/ts/components/common/CreateButton.vue'
import DragWrapper from '@/ts/components/drag/DragWrapper.vue'

import { useUploadDialog } from '@/ts/hooks/useUploadDialog'

const store = useUploadDialog()

</script>

<style scoped lang="scss">
.container {
  max-width: 1280px;
  margin: auto;
  padding: 0 20px;
}
</style>