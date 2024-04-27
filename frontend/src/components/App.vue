<template>
	<RouterView />
</template>

<script lang="ts" setup>

import { onMounted } from 'vue'

import { useAuthWatcher } from '@/hooks/useAuth'
import { fetch as collectionSelectorFetch } from '@/hooks/useCollectionSelector'
import { subscribeToCollectionsList } from '@/model/CollectionsModel'

// TODO remove
onMounted(() => {
	subscribeToCollectionsList(() => collectionSelectorFetch())
})

useAuthWatcher()

</script>

<style scoped lang="scss"></style>