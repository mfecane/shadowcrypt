<script setup lang="ts">
useHead({
	title: 'User settings',
})
</script>

<template>
	<div class="text-primary mx-auto flex max-w-[600px] flex-col gap-4 px-5 py-10 pb-24">
		<div class="flex flex-col gap-10">
			<div class="flex flex-col gap-4">
				<UButton to="/list" variant="ghost" color="neutral" icon="i-lucide-arrow-left" class="-ms-2 self-start">
					Collections
				</UButton>
				<h1 class="text-5xl font-normal">User settings</h1>
			</div>
			<UserSettingsForm />
		</div>
	</div>
</template>
