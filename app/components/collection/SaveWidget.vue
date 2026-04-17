<script setup lang="ts">
import CollectionToolbarButton from '~/components/collection/CollectionToolbarButton.vue'

const { bridge, collectionSaveStatus, collectionSaveError } = storeToRefs(useCollectionViewerStore())

const status = computed(() => collectionSaveStatus.value)
let savedDisplayTimer: ReturnType<typeof setTimeout> | null = null
const recentlySaved = ref(false)

const isSaving = computed(() => status.value === 'saving')
const isSaved = computed(() => status.value === 'saved' || recentlySaved.value)
const isError = computed(() => status.value === 'error')

const clearSavedDisplayTimer = (): void => {
	if (savedDisplayTimer !== null) {
		clearTimeout(savedDisplayTimer)
		savedDisplayTimer = null
	}
}

const markRecentlySaved = (): void => {
	recentlySaved.value = true
	clearSavedDisplayTimer()
	savedDisplayTimer = setTimeout(() => {
		recentlySaved.value = false
		savedDisplayTimer = null
	}, 2000)
}

watch(status, (nextStatus) => {
	if (nextStatus === 'saved') {
		markRecentlySaved()
		return
	}
	if (nextStatus === 'saving' || nextStatus === 'error') {
		recentlySaved.value = false
		clearSavedDisplayTimer()
	}
})

onBeforeUnmount(() => {
	clearSavedDisplayTimer()
})

const icon = computed(() => {
	if (isSaving.value) {
		return 'i-lucide-loader-2'
	}
	if (isSaved.value) {
		return 'i-lucide-check'
	}
	if (isError.value) {
		return 'i-lucide-alert-circle'
	}
	return 'i-lucide-save'
})

const iconClass = computed(() => {
	if (isSaved.value) {
		return 'text-green-500'
	}
	if (isError.value) {
		return 'text-red-400'
	}
	return ''
})

const tooltip = computed(() => {
	if (isError.value) {
		return collectionSaveError.value ?? 'Save failed'
	}
	if (isSaving.value) {
		return 'Saving…'
	}
	if (isSaved.value) {
		return 'Saved'
	}
	return 'Save'
})

const saveDisabled = computed(() => bridge.value === null || isSaving.value)
</script>

<template>
	<div class="flex items-center rounded-lg bg-neutral-900/70 p-2 backdrop-blur-sm">
		<CollectionToolbarButton
			:icon="icon"
			:tooltip="tooltip"
			:icon-class="iconClass"
			:disabled="saveDisabled"
			:spin="isSaving"
			@click="bridge?.saveNow()"
		/>
	</div>
</template>
