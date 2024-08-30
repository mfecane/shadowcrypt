<template></template>

<script setup lang="ts">

import { useRouter } from 'vue-router'

import { useAuth } from '@/hooks/useAuth'

const router = useRouter()
const user = useAuth()

if (user.user) {
    router.push('/list')
} else {
    router.push('/landing')
}
</script>


<style scoped lang="scss"></style>
