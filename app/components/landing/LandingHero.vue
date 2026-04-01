<template>
	<section
		class="landing-hero relative isolate flex min-h-[560px] min-h-screen flex-col bg-zinc-950 bg-cover bg-center bg-no-repeat"
	>
		<div
			class="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col justify-between gap-8 px-6 pb-[18vh] pt-12 sm:px-10"
		>
			<div class="flex justify-between self-stretch">
				<LandingLogo />
			</div>
			<div class="mt-auto flex max-w-xl flex-col items-start">
				<h1 class="text-primary mb-5 max-w-[560px] text-4xl font-medium leading-tight sm:text-5xl">
					Get inspired for your artistic projects
				</h1>
				<h2
					class="text-muted mb-12 max-w-[500px] text-xl font-normal leading-relaxed sm:text-[1.8rem] sm:leading-[2.7rem]"
				>
					Build and organize your visual reference library
				</h2>
				<div class="flex flex-wrap gap-6">
					<UButton
						to="/auth/gate"
						color="primary"
						size="xl"
						class="min-w-[240px] justify-center"
						trailing-icon="i-lucide-arrow-right"
					>
						Start your library
					</UButton>
				</div>
			</div>
		</div>
	</section>
</template>

<style scoped>
.landing-hero {
	background-image:
		linear-gradient(to bottom, rgb(0 0 0 / 45%), rgb(0 0 0 / 55%)), url('/assets/images/goblin_merged.png'),
		url('/assets/images/goblin_merged.jpg');
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
}

@media (max-aspect-ratio: 2/3) {
	.landing-hero {
		background-position: 65% center;
	}
}
</style>
