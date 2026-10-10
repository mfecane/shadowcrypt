<template>
	<div data-id="admin-layout" class="flex min-h-screen">
		<AdminSidebar />
		<main class="min-w-0 flex-1 p-6">
			<slot />
		</main>
	</div>
</template>
