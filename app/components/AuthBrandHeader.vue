<template>
	<div class="text-2xl">
		<NuxtLink to="/" class="text-beige-400 hover:text-beige-300 flex items-center gap-2 transition-colors">
			<AppLogo />
		</NuxtLink>
	</div>
	<div class="pt-4">
		<slot />
	</div>
</template>
