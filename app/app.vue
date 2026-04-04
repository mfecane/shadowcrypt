<template>
	<UApp>
		<NuxtRouteAnnouncer />
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
		<ClientOnly>
			<CollectionQuickFindOverlay />
			<ImageUploadOverlay />
			<ImageUploadOpenButton />
			<CollectionListEditOverlays />
			<DevPanelOverlay />
		</ClientOnly>
		<DemoOverlay />
	</UApp>
</template>
