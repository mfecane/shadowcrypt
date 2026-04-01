<script setup lang="ts">
definePageMeta({
	layout: 'landing',
	auth: {
		unauthenticatedOnly: true,
		navigateAuthenticatedTo: '/list',
	},
})

useHead({
	title: 'Shadowcrypt',
})
</script>

<template>
	<LandingView />
</template>
