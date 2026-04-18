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

const buttonColor = computed(() => {
	if (isSaved.value) {
		return 'success'
	}
	if (isError.value) {
		return 'error'
	}
	return 'neutral'
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
	<CollectionToolbarButton
		:icon="icon"
		:tooltip="tooltip"
		:color="buttonColor"
		:disabled="saveDisabled"
		:spin="isSaving"
		@click="bridge?.saveNow()"
	/>
</template>
