<template>
	<div class="absolute inset-0 z-5 flex items-center justify-center bg-black/55 backdrop-blur-[2px]"
		aria-live="polite" aria-busy="true">
		<div class="border-muted bg-elevated flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl">
			<Icon name="i-lucide-loader-2" class="h-5 w-5 animate-spin text-toned" />
			<div>
				<p class="text-highlighted text-sm font-medium">Auto-layout in progress</p>
				<p class="text-muted text-xs">Interactions are temporarily disabled.</p>
			</div>
		</div>
	</div>
</template>