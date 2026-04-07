<script setup lang="ts">
definePageMeta({
	auth: false,
})

useHead({
	title: 'Design system',
})

const radii = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
const neutralSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const beigeSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

const semanticText = [
	{
		name: 'Dimmed',
		className: 'text-dimmed',
		copy: 'Background metadata, labels, and low-priority context.',
	},
	{
		name: 'Muted',
		className: 'text-muted',
		copy: 'Secondary descriptions and supporting interface copy.',
	},
	{
		name: 'Toned',
		className: 'text-toned',
		copy: 'Warm emphasis used for accents, figures, and active signals.',
	},
	{
		name: 'Default',
		className: 'text-default',
		copy: 'Primary body copy for long reading surfaces.',
	},
	{
		name: 'Highlighted',
		className: 'text-highlighted',
		copy: 'Headings, selected content, and strong interface focus.',
	},
] as const

const surfaces = [
	{
		name: 'Canvas',
		bgClass: 'bg-default',
		borderClass: 'border-default',
		textClass: 'text-default',
		copy: 'Base application background and largest layout areas.',
	},
	{
		name: 'Muted surface',
		bgClass: 'bg-muted',
		borderClass: 'border-muted',
		textClass: 'text-default',
		copy: 'Nested groups, rails, and low-elevation panels.',
	},
	{
		name: 'Elevated',
		bgClass: 'bg-elevated',
		borderClass: 'border-default',
		textClass: 'text-default',
		copy: 'Dialogs, cards, and focused work areas.',
	},
	{
		name: 'Accent',
		bgClass: 'bg-accented',
		borderClass: 'border-accented',
		textClass: 'text-highlighted',
		copy: 'Calls to action, selected rows, and key highlights.',
	},
] as const

function cssVarColor(scale: 'neutral' | 'beige', step: number): string {
	return `var(--color-${scale}-${step})`
}
</script>

<template>
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 pb-24 sm:px-6 lg:px-8">
		<section class="overflow-hidden rounded-3xl border border-default bg-[radial-gradient(circle_at_top_left,rgba(188,145,80,0.22),transparent_30%),linear-gradient(180deg,rgba(29,32,33,0.96),rgba(10,10,11,0.92))]">
			<div class="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.95fr)] lg:px-8 lg:py-10">
				<div class="flex flex-col gap-5">
					<div class="flex flex-wrap items-center gap-3">
						<span class="rounded-full border border-accented bg-accented/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-toned">
							Shadowcrypt system
						</span>
						<span class="text-dimmed text-xs uppercase tracking-[0.24em]">Dark utility language</span>
					</div>

					<div class="max-w-3xl space-y-4">
						<h1 class="max-w-3xl text-4xl font-semibold tracking-tight text-highlighted sm:text-5xl">
							A single page to verify tone, hierarchy, and component fit.
						</h1>
						<p class="max-w-2xl text-base leading-7 text-muted sm:text-lg">
							This route turns
							<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-highlighted">main.css</code>
							into a practical showcase of palette tokens, semantic text, surfaces, radii, and common UI
							combinations on the live application background.
						</p>
					</div>

					<div class="flex flex-wrap gap-3">
						<UButton color="primary" variant="solid" size="lg">Primary action</UButton>
						<UButton color="neutral" variant="soft" size="lg">Secondary action</UButton>
						<UButton color="neutral" variant="outline" size="lg">Outline action</UButton>
					</div>
				</div>

				<div class="rounded-2xl border border-default bg-elevated/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
					<div class="mb-4 flex items-center justify-between">
						<div>
							<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Snapshot</p>
							<h2 class="text-highlighted mt-1 text-lg font-semibold">Interface rhythm</h2>
						</div>
						<div class="flex gap-2">
							<span class="size-2.5 rounded-full bg-neutral-500" />
							<span class="size-2.5 rounded-full bg-beige-500" />
							<span class="size-2.5 rounded-full bg-neutral-300" />
						</div>
					</div>

					<div class="space-y-3 rounded-2xl border border-muted bg-default p-4">
						<div class="flex items-start justify-between gap-4">
							<div class="space-y-1">
								<p class="text-highlighted text-sm font-medium">Quarterly vault review</p>
								<p class="text-muted text-sm">A compact panel preview using the shipped surface and text utilities.</p>
							</div>
							<div class="rounded-full border border-accented bg-accented px-2.5 py-1 text-xs font-medium text-highlighted">
								Active
							</div>
						</div>

						<div class="grid gap-3 sm:grid-cols-3">
							<div class="rounded-xl border border-default bg-elevated p-3">
								<p class="text-dimmed text-[11px] uppercase tracking-[0.2em]">Primary</p>
								<p class="text-highlighted mt-2 text-2xl font-semibold">86%</p>
								<p class="text-muted mt-1 text-xs">Signal confidence</p>
							</div>
							<div class="rounded-xl border border-default bg-elevated p-3">
								<p class="text-dimmed text-[11px] uppercase tracking-[0.2em]">Accent</p>
								<p class="text-toned mt-2 text-2xl font-semibold">12.4k</p>
								<p class="text-muted mt-1 text-xs">Protected files</p>
							</div>
							<div class="rounded-xl border border-default bg-elevated p-3">
								<p class="text-dimmed text-[11px] uppercase tracking-[0.2em]">Latency</p>
								<p class="text-highlighted mt-2 text-2xl font-semibold">42ms</p>
								<p class="text-muted mt-1 text-xs">Sync response</p>
							</div>
						</div>

						<div class="rounded-xl border border-muted bg-muted p-3">
							<div class="mb-2 flex items-center justify-between text-xs">
								<span class="text-muted">Archive completion</span>
								<span class="text-toned">73%</span>
							</div>
							<div class="h-2 rounded-full bg-default">
								<div class="h-2 rounded-full bg-accented" style="width: 73%" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
			<div class="space-y-8">
				<div class="rounded-3xl border border-default bg-elevated/80 p-6">
					<div class="mb-5 flex items-center justify-between gap-4">
						<div>
							<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Typography</p>
							<h2 class="text-highlighted mt-1 text-2xl font-semibold">Semantic text roles</h2>
						</div>
						<p class="text-muted max-w-sm text-sm">These classes define reading hierarchy without relying on ad hoc hex values.</p>
					</div>

					<div class="space-y-3">
						<div
							v-for="item in semanticText"
							:key="item.name"
							class="flex flex-col gap-2 rounded-2xl border border-default bg-default/80 p-4 md:flex-row md:items-start md:justify-between"
						>
							<div>
								<p class="text-dimmed text-xs uppercase tracking-[0.18em]">{{ item.name }}</p>
								<p :class="[item.className, 'mt-2 text-lg font-medium']">{{ item.className }}</p>
							</div>
							<p class="text-muted max-w-md text-sm leading-6">{{ item.copy }}</p>
						</div>
					</div>
				</div>

				<div class="rounded-3xl border border-default bg-elevated/80 p-6">
					<div class="mb-5">
						<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Components</p>
						<h2 class="text-highlighted mt-1 text-2xl font-semibold">Common control combinations</h2>
					</div>

					<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
						<div class="rounded-2xl border border-default bg-default p-4">
							<div class="flex flex-wrap gap-3">
								<UButton color="primary" variant="solid">Primary</UButton>
								<UButton color="neutral" variant="soft">Soft</UButton>
								<UButton color="neutral" variant="outline">Outline</UButton>
								<UButton color="neutral" variant="ghost">Ghost</UButton>
							</div>

							<div class="mt-4 grid gap-3">
								<UInput placeholder="Search collections" />
								<div class="rounded-xl border border-muted bg-muted p-3">
									<p class="text-highlighted text-sm font-medium">Selected row</p>
									<p class="text-muted mt-1 text-sm">
										Use
										<code class="rounded bg-default px-1 py-0.5 font-mono text-xs text-highlighted">bg-accented</code>
										with highlighted text when selection needs strong contrast.
									</p>
								</div>
							</div>
						</div>

						<div class="rounded-2xl border border-muted bg-muted p-4">
							<p class="text-dimmed text-xs uppercase tracking-[0.18em]">Usage notes</p>
							<ul class="mt-3 space-y-3 text-sm leading-6 text-muted">
								<li>Primary beige is warm and deliberate. Reserve it for actions or key metrics, not general decoration.</li>
								<li>Neutral surfaces carry most layout structure. The system relies on value shifts more than hue shifts.</li>
								<li>Select this paragraph to verify the global <code class="text-highlighted">::selection</code> treatment.</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="rounded-3xl border border-default bg-elevated/80 p-6">
					<div class="mb-5">
						<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Surfaces</p>
						<h2 class="text-highlighted mt-1 text-2xl font-semibold">Background and border pairings</h2>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div
							v-for="surface in surfaces"
							:key="surface.name"
							:class="[surface.bgClass, surface.borderClass, 'rounded-2xl border p-5']"
						>
							<p class="text-dimmed text-xs uppercase tracking-[0.18em]">{{ surface.name }}</p>
							<p :class="[surface.textClass, 'mt-2 text-lg font-medium']">{{ surface.bgClass }}</p>
							<p :class="[surface.textClass === 'text-highlighted' ? 'text-highlighted/80' : 'text-muted', 'mt-2 text-sm leading-6']">
								{{ surface.copy }}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div class="space-y-8">
				<div class="rounded-3xl border border-default bg-elevated/80 p-6">
					<div class="mb-5">
						<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Palette</p>
						<h2 class="text-highlighted mt-1 text-2xl font-semibold">Token scales</h2>
					</div>

					<div class="space-y-5">
						<div>
							<div class="mb-3 flex items-center justify-between">
								<h3 class="text-default text-sm font-medium">Neutral</h3>
								<span class="text-dimmed text-xs">cool, slightly green</span>
							</div>
							<div class="grid grid-cols-[repeat(11,minmax(0,1fr))] gap-2">
								<div v-for="n in neutralSteps" :key="n" class="space-y-2">
									<div
										class="aspect-square rounded-xl border border-default"
										:style="{ backgroundColor: cssVarColor('neutral', n) }"
									/>
									<p class="text-dimmed text-center font-mono text-[10px]">{{ n }}</p>
								</div>
							</div>
						</div>

						<div>
							<div class="mb-3 flex items-center justify-between">
								<h3 class="text-default text-sm font-medium">Beige</h3>
								<span class="text-dimmed text-xs">warm accent scale</span>
							</div>
							<div class="grid grid-cols-[repeat(11,minmax(0,1fr))] gap-2">
								<div v-for="b in beigeSteps" :key="b" class="space-y-2">
									<div
										class="aspect-square rounded-xl border border-default"
										:style="{ backgroundColor: cssVarColor('beige', b) }"
									/>
									<p class="text-dimmed text-center font-mono text-[10px]">{{ b }}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="rounded-3xl border border-default bg-elevated/80 p-6">
					<div class="mb-5">
						<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Shape</p>
						<h2 class="text-highlighted mt-1 text-2xl font-semibold">Radius scale</h2>
					</div>

					<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div
							v-for="radius in radii"
							:key="radius"
							class="rounded-2xl border border-default bg-default p-4 text-center"
						>
							<div
								class="mx-auto mb-3 h-16 w-full max-w-28 border border-accented bg-accented/20"
								:style="{ borderRadius: `var(--radius-${radius})` }"
							/>
							<p class="text-default text-sm font-medium">{{ radius }}</p>
							<p class="text-dimmed mt-1 font-mono text-[10px]">--radius-{{ radius }}</p>
						</div>
					</div>
				</div>

				<div class="rounded-3xl border border-default bg-elevated/80 p-6">
					<div class="mb-5">
						<p class="text-dimmed text-xs uppercase tracking-[0.22em]">Reference</p>
						<h2 class="text-highlighted mt-1 text-2xl font-semibold">Design principles</h2>
					</div>

					<div class="space-y-4 rounded-2xl border border-muted bg-default p-4">
						<div>
							<p class="text-highlighted text-sm font-medium">1. Contrast first</p>
							<p class="text-muted mt-1 text-sm leading-6">Hierarchy comes from luminance steps and restrained accent use, not from adding more colors.</p>
						</div>
						<div>
							<p class="text-highlighted text-sm font-medium">2. Warmth is intentional</p>
							<p class="text-muted mt-1 text-sm leading-6">The beige scale should feel premium and rare. It is the system’s emphasis color, not the base UI fill.</p>
						</div>
						<div>
							<p class="text-highlighted text-sm font-medium">3. Surfaces stack quietly</p>
							<p class="text-muted mt-1 text-sm leading-6">Default, muted, and elevated backgrounds should be enough to separate almost every layer in the app.</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</template>
