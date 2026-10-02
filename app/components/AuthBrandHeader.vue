<template>
	<div class="text-2xl">
		<NuxtLink to="/" class="text-primary hover:text-highlighted flex items-center gap-2 transition-colors">
			<AppLogo collapsible />
		</NuxtLink>
	</div>
	<div class="pt-4">
		<slot />
	</div>
</template>
