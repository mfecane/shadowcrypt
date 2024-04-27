<template>
    <LoggedIn>
        <Collection :id="props.id" />
    </LoggedIn>
</template>

<script setup lang="ts">

import LoggedIn from '@/components/pages/LoggedIn.vue'
import Collection from '@/components/collection/Collection.vue'

const props = defineProps<{ id: string }>()

</script>

<style lang="scss" scoped></style>
