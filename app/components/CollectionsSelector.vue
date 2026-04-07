<script setup lang="ts">
interface SelectorOption {
	id: string
	name: string
}

interface SelectorGroup {
	label: string
	options: SelectorOption[]
}

const props = withDefaults(
	defineProps<{
		modelValue: string | null
		groups: SelectorGroup[]
		placeholder?: string
		disabled?: boolean
	}>(),
	{
		placeholder: 'Select collection',
		disabled: false,
	}
)

const emit = defineEmits<{
	'update:modelValue': [value: string | null]
}>()

const rootEl = ref<HTMLElement | null>(null)
const open = ref(false)

const selectedOption = computed(() => {
	for (const group of props.groups) {
		const match = group.options.find((option) => option.id === props.modelValue)
		if (match !== undefined) {
			return match
		}
	}
	return null
})

function close(): void {
	open.value = false
}

function toggle(): void {
	if (props.disabled) {
		return
	}
	open.value = !open.value
}

function selectOption(id: string): void {
	emit('update:modelValue', id)
	close()
}

function onDocumentPointerDown(event: MouseEvent): void {
	const root = rootEl.value
	if (root === null) {
		return
	}
	const target = event.target
	if (target instanceof Node && !root.contains(target)) {
		close()
	}
}

function onDocumentKeydown(event: KeyboardEvent): void {
	if (event.key === 'Escape') {
		close()
	}
}

watch(
	() => props.disabled,
	(disabled) => {
		if (disabled) {
			close()
		}
	}
)

onMounted(() => {
	document.addEventListener('mousedown', onDocumentPointerDown)
	document.addEventListener('keydown', onDocumentKeydown)
})

onBeforeUnmount(() => {
	document.removeEventListener('mousedown', onDocumentPointerDown)
	document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
	<div ref="rootEl" class="relative min-w-0 flex-1">
		<UButton
			color="neutral"
			variant="soft"
			class="w-full justify-between bg-muted hover:bg-muted active:bg-muted"
			:disabled="disabled"
			@click="toggle"
		>
			<span class="truncate">{{ selectedOption?.name ?? placeholder }}</span>
			<Icon
				name="i-lucide-chevron-down"
				class="h-4 w-4 shrink-0 transition-transform"
				:class="{ 'rotate-180': open }"
			/>
		</UButton>

		<div
			v-if="open"
			class="bg-muted border-muted absolute left-0 top-[calc(100%+0.5rem)] z-20 max-h-80 w-full overflow-y-auto rounded-xl border p-2 shadow-2xl"
		>
			<div v-if="groups.length === 0" class="text-muted px-3 py-2 text-sm">No collections available.</div>
			<section v-for="group in groups" :key="group.label" class="mb-2 last:mb-0">
				<p class="text-dimmed px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em]">
					{{ group.label }}
				</p>
				<button
					v-for="option in group.options"
					:key="option.id"
					type="button"
					class="text-default hover:bg-elevated flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
					:class="option.id === modelValue ? 'bg-accented text-highlighted hover:bg-accented' : ''"
					@click="selectOption(option.id)"
				>
					<span class="truncate">{{ option.name }}</span>
					<Icon v-if="option.id === modelValue" name="i-lucide-check" class="h-4 w-4 shrink-0" />
				</button>
			</section>
		</div>
	</div>
</template>
