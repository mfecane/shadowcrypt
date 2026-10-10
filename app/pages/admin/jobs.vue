<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Admin jobs' })
</script>

<template>
	<AdminJobsView />
</template>
