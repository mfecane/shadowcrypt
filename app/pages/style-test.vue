<script setup lang="ts">
definePageMeta({
	auth: false,
})

useHead({
	title: 'Style test',
})

const radii = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const

const neutralSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const beigeSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

function cssVarColor(scale: 'neutral' | 'beige', step: number): string {
	return `var(--color-${scale}-${step})`
}
</script>

<template>
	<div class="mx-auto max-w-5xl px-5 py-10 pb-24">
		<header class="mb-12 border-b border-default pb-8">
			<h1 class="text-highlighted mb-2 text-2xl font-semibold tracking-tight">Style tester</h1>
			<p class="text-muted max-w-xl text-sm">
				Live preview of
				<code class="text-toned rounded-sm bg-elevated px-1 py-0.5 font-mono text-xs">main.css</code>
				theme tokens, radii, palettes, and Nuxt UI on the app background.
			</p>
		</header>

		<section class="mb-14">
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Radii (--radius-*)</h2>
			<div class="flex flex-wrap gap-4">
				<div v-for="r in radii" :key="r" class="flex flex-col items-center gap-2">
					<div
						class="bg-accented border-default size-14 border"
						:style="{ borderRadius: `var(--radius-${r})` }"
					/>
					<span class="text-muted font-mono text-[10px]">{{ r }}</span>
				</div>
			</div>
		</section>

		<section class="mb-14">
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Neutral</h2>
			<div class="flex flex-nowrap gap-2 overflow-x-auto pb-1">
				<div
					v-for="n in neutralSteps"
					:key="n"
					class="flex w-20 shrink-0 flex-col overflow-hidden rounded-md border border-default"
				>
					<div class="aspect-4/3 min-h-12 w-full" :style="{ backgroundColor: cssVarColor('neutral', n) }" />
					<span class="text-muted bg-elevated px-2 py-1 font-mono text-[10px]">neutral-{{ n }}</span>
				</div>
			</div>
		</section>

		<section class="mb-14">
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Beige</h2>
			<div class="flex flex-nowrap gap-2 overflow-x-auto pb-1">
				<div
					v-for="b in beigeSteps"
					:key="b"
					class="flex w-20 shrink-0 flex-col overflow-hidden rounded-md border border-default"
				>
					<div class="aspect-4/3 min-h-12 w-full" :style="{ backgroundColor: cssVarColor('beige', b) }" />
					<span class="text-muted bg-elevated px-2 py-1 font-mono text-[10px]">beige-{{ b }}</span>
				</div>
			</div>
		</section>

		<section class="mb-14">
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Semantic text</h2>
			<div class="bg-elevated border-default space-y-2 rounded-lg border p-6">
				<p class="text-dimmed">text-dimmed — dimmed body</p>
				<p class="text-muted">text-muted — secondary copy</p>
				<p class="text-toned">text-toned — toned emphasis</p>
				<p class="text-default">text-default — default</p>
				<p class="text-highlighted">text-highlighted — headings / strong</p>
			</div>
		</section>

		<section class="mb-14">
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Surfaces & borders</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg border border-default bg-default p-4">
					<span class="text-muted text-xs font-mono">bg-default + border-default</span>
				</div>
				<div class="rounded-lg border border-muted bg-muted p-4">
					<span class="text-muted text-xs font-mono">bg-muted + border-muted</span>
				</div>
				<div class="rounded-lg border border-default bg-elevated p-4">
					<span class="text-muted text-xs font-mono">bg-elevated</span>
				</div>
				<div class="rounded-lg border border-accented bg-accented p-4">
					<span class="text-muted text-xs font-mono">bg-accented + border-accented</span>
				</div>
			</div>
		</section>

		<section class="mb-14">
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Nuxt UI</h2>
			<div class="bg-elevated border-default flex flex-wrap items-center gap-3 rounded-lg border p-6">
				<UButton color="primary" variant="solid">Primary</UButton>
				<UButton color="neutral" variant="soft">Neutral soft</UButton>
				<UButton color="neutral" variant="outline">Outline</UButton>
				<UButton color="neutral" variant="ghost">Ghost</UButton>
				<UInput placeholder="Input" class="w-48" />
			</div>
		</section>

		<section>
			<h2 class="text-muted mb-4 text-xs font-semibold uppercase tracking-wider">Selection</h2>
			<p class="text-toned text-sm">
				Select this sentence to preview
				<code class="text-highlighted">::selection</code>
				(primary tint + highlighted text).
			</p>
		</section>
	</div>
</template>
