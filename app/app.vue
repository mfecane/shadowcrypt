<template>
	<UApp>
		<NuxtRouteAnnouncer />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
		<ClientOnly>
			<CollectionQuickFindModal />
			<CollectionListEditModals />
			<FloatingToolbar />
		</ClientOnly>
		<DemoModal />
	</UApp>
</template>
