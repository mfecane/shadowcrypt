<script setup lang="ts">
// TODO it flickers

const { collectionSaveStatus, collectionSaveError } = storeToRefs(useCollectionViewerStore())

const expanded = computed(() => collectionSaveStatus.value !== 'idle')

const isError = computed(() => collectionSaveStatus.value === 'error')

const iconSpin = computed(() => collectionSaveStatus.value === 'saving')

const rowClass = computed((): string => {
	const s = collectionSaveStatus.value
	if (s === 'saving') {
		return 'text-primary'
	}
	if (s === 'saved') {
		return 'text-green-500'
	}
	if (s === 'error') {
		return 'text-red-400'
	}
	return ''
})

const icon = computed((): string => {
	const s = collectionSaveStatus.value
	if (s === 'saving') {
		return 'i-lucide-loader-2'
	}
	if (s === 'saved') {
		return 'i-lucide-check'
	}
	if (s === 'error') {
		return 'i-lucide-alert-circle'
	}
	return ''
})

watch(
	collectionSaveError,
	() => {
		console.log('collectionSaveError', collectionSaveError.value)
	},
	{ immediate: true }
)
</script>

<template>
	<div>
		<Transition name="save-widget" mode="out-in">
			<div
				v-if="expanded"
				:key="collectionSaveStatus"
				class="inline-flex min-w-0 items-center justify-center gap-1 p-2 text-xs rounded-lg bg-neutral-900/70 backdrop-blur-sm w-12 h-12"
				:class="rowClass"
			>
				<UTooltip
					v-if="isError"
					:text="collectionSaveError ?? 'Save failed'"
					:content="{ side: 'bottom', align: 'start' }"
				>
					<Icon :name="icon" class="h-4 w-4 shrink-0 cursor-default" />
				</UTooltip>
				<Icon v-else :name="icon" class="h-4 w-4 shrink-0" :class="{ 'animate-spin': iconSpin }" />
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.save-widget-enter-active,
.save-widget-leave-active {
	transition:
		opacity 0.22s ease,
		transform 0.22s ease;
}

.save-widget-enter-from,
.save-widget-leave-to {
	opacity: 0;
	transform: scale(0.92);
}
</style>
