<template>
	<div class="text-muted mx-auto max-w-6xl px-6 py-20 pb-24 sm:px-10">
		<div class="flex flex-col gap-10 md:flex-row md:gap-4">
			<div class="min-w-0 flex-[0_1_40%]">
				<h3 class="text-primary text-4xl font-normal sm:text-[2.8rem]">Build</h3>
				<p class="mt-4 text-[22px] leading-relaxed">
					Save images to your collection by dragging and dropping or copying and pasting them.
				</p>
			</div>
			<img
				class="min-w-0 flex-[0_1_60%] object-contain"
				src="/assets/images/cat.png"
				alt=""
				width="400"
				height="400"
			>
		</div>

		<div class="mt-10 flex flex-col gap-10 md:mt-10 md:flex-row-reverse md:gap-4">
			<div class="min-w-0 flex-[0_1_40%]">
				<h3 class="text-primary text-4xl font-normal sm:text-[2.8rem]">Organize</h3>
				<p class="mt-4 text-[22px] leading-relaxed">
					Organize your collections by groups Pin any collection for quick access
				</p>
			</div>
			<img
				class="min-w-0 flex-[0_1_60%] object-contain"
				src="/assets/images/cat.png"
				alt=""
				width="400"
				height="400"
			>
		</div>

		<div class="mt-10 flex flex-col gap-10 md:mt-10 md:flex-row md:gap-4">
			<div class="min-w-0 flex-[0_1_40%]">
				<h3 class="text-primary text-4xl font-normal sm:text-[2.8rem]">Share</h3>
				<p class="mt-4 text-[22px] leading-relaxed">
					Organize your collections by groups Pin any collection for quick access
				</p>
			</div>
			<img
				class="min-w-0 flex-[0_1_60%] object-contain"
				src="/assets/images/cat.png"
				alt=""
				width="400"
				height="400"
			>
		</div>

		<div class="flex justify-center pt-10">
			<UButton to="/auth/gate" color="primary" size="xl" trailing-icon="i-lucide-arrow-right">
				Start building your library
			</UButton>
		</div>
	</div>
</template>
