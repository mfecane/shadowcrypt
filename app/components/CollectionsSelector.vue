<script setup lang="ts">
import { rankByFuzzyName } from '~~/lib/fuzzyMatchCollectionName'

interface SelectorOption {
	id: string
	name: string
}

interface SelectorGroup {
	label: string
	options: SelectorOption[]
}

type ListRow = { type: 'heading'; label: string } | { type: 'option'; option: SelectorOption; flatIndex: number }

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

const listboxId = useId()
const rootEl = ref<HTMLElement | null>(null)
const open = ref(false)
const highlightIndex = ref<number | null>(null)
const query = ref('')

const filteredGroups = computed(() =>
	props.groups
		.map((group) => ({
			label: group.label,
			options: rankByFuzzyName(group.options, query.value),
		}))
		.filter((group) => group.options.length > 0)
)

const flatOptions = computed(() => {
	const out: SelectorOption[] = []
	for (const group of filteredGroups.value) {
		for (const option of group.options) {
			out.push(option)
		}
	}
	return out
})

const listRows = computed((): ListRow[] => {
	const rows: ListRow[] = []
	let flatIndex = 0
	for (const group of filteredGroups.value) {
		rows.push({ type: 'heading', label: group.label })
		for (const option of group.options) {
			rows.push({ type: 'option', option, flatIndex: flatIndex++ })
		}
	}
	return rows
})

const selectedOption = computed(() => {
	for (const group of props.groups) {
		const match = group.options.find((option) => option.id === props.modelValue)
		if (match !== undefined) {
			return match
		}
	}
	return null
})

const activeDescendantId = computed(() => {
	if (!open.value || highlightIndex.value === null) {
		return undefined
	}
	return `${listboxId}-option-${highlightIndex.value}`
})

const inputValue = computed(() => {
	if (open.value) {
		return query.value
	}
	return selectedOption.value?.name ?? ''
})

function focusInput(): void {
	const input = rootEl.value?.querySelector('input')
	if (input instanceof HTMLInputElement) {
		input.focus()
	}
}

function close(): void {
	open.value = false
	query.value = ''
	void nextTick(() => focusInput())
}

function openSelector(): void {
	if (props.disabled) {
		return
	}
	open.value = true
}

function onInput(value: string | number): void {
	if (props.disabled) {
		return
	}
	query.value = String(value)
	openSelector()
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

watch(open, (isOpen) => {
	if (!isOpen) {
		highlightIndex.value = null
		return
	}
	const n = flatOptions.value.length
	if (n === 0) {
		highlightIndex.value = null
		return
	}
	const idx = flatOptions.value.findIndex((o) => o.id === props.modelValue)
	highlightIndex.value = idx >= 0 ? idx : 0
	void nextTick(() => focusInput())
})

watch(query, () => {
	if (!open.value) {
		return
	}
	const n = flatOptions.value.length
	if (n === 0) {
		highlightIndex.value = null
		return
	}
	highlightIndex.value = 0
})

watch([highlightIndex, open], async () => {
	if (!open.value || highlightIndex.value === null) {
		return
	}
	await nextTick()
	document.getElementById(`${listboxId}-option-${highlightIndex.value}`)?.scrollIntoView({
		block: 'nearest',
	})
})

function onInputFocus(): void {
	if (!open.value) {
		query.value = ''
	}
	openSelector()
}

function onInputClick(): void {
	openSelector()
}

function onInputKeydown(e: KeyboardEvent): void {
	if (props.disabled) {
		return
	}

	if (e.key === 'Escape') {
		if (open.value) {
			e.preventDefault()
			close()
		}
		return
	}

	if (e.key === 'Tab' && open.value) {
		close()
		return
	}

	if (!open.value) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault()
			open.value = true
			if (e.key === 'ArrowUp') {
				nextTick(() => {
					const n = flatOptions.value.length
					highlightIndex.value = n === 0 ? null : n - 1
				})
			}
			return
		}
		if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			open.value = true
		}
	}

	const len = flatOptions.value.length
	if (len === 0 && ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(e.key)) {
		e.preventDefault()
		return
	}

	if (e.key === 'ArrowDown') {
		e.preventDefault()
		const hi = highlightIndex.value ?? -1
		highlightIndex.value = Math.min(hi + 1, len - 1)
		return
	}
	if (e.key === 'ArrowUp') {
		e.preventDefault()
		const hi = highlightIndex.value ?? len
		highlightIndex.value = Math.max(hi - 1, 0)
		return
	}
	if (e.key === 'Home') {
		e.preventDefault()
		highlightIndex.value = 0
		return
	}
	if (e.key === 'End') {
		e.preventDefault()
		highlightIndex.value = len - 1
		return
	}
	if (e.key === 'Enter' || e.key === ' ') {
		if (!open.value && e.key === ' ') {
			open.value = true
			return
		}
		e.preventDefault()
		const hi = highlightIndex.value
		if (hi !== null && flatOptions.value[hi] !== undefined) {
			selectOption(flatOptions.value[hi].id)
		}
	}
}

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
		<UInput
			:model-value="inputValue"
			icon="i-lucide-search"
			class="w-full"
			:disabled="disabled"
			:placeholder="placeholder"
			role="combobox"
			:aria-expanded="open"
			aria-haspopup="listbox"
			:aria-controls="listboxId"
			:aria-activedescendant="activeDescendantId"
			@update:model-value="onInput"
			@focus="onInputFocus"
			@click="onInputClick"
			@keydown="onInputKeydown"
		>
			<template #trailing>
				<Icon
					name="i-lucide-chevron-down"
					class="h-4 w-4 shrink-0 transition-transform"
					:class="{ 'rotate-180': open }"
					aria-hidden="true"
				/>
			</template>
		</UInput>

		<div
			v-if="open"
			:id="listboxId"
			role="listbox"
			class="bg-neutral-900 border-muted absolute left-0 top-[calc(100%+0.5rem)] z-20 max-h-80 w-full overflow-y-auto rounded-xl border p-2 shadow-2xl"
		>
			<div v-if="props.groups.length === 0" class="text-muted px-3 py-2 text-sm">No collections available.</div>
			<div v-else-if="listRows.length === 0" class="text-muted px-3 py-2 text-sm">No matching collections.</div>
			<template
				v-for="(row, rowIdx) in listRows"
				:key="row.type === 'heading' ? `heading-${rowIdx}` : row.option.id"
			>
				<p
					v-if="row.type === 'heading'"
					class="text-dimmed px-3 py-2 text-[11px] font-medium uppercase tracking-[0.18em]"
				>
					{{ row.label }}
				</p>
				<button
					v-else
					:id="`${listboxId}-option-${row.flatIndex}`"
					type="button"
					tabindex="-1"
					role="option"
					:aria-selected="row.option.id === modelValue"
					class="text-default hover:bg-elevated flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
					:class="[
						row.option.id === modelValue ? 'bg-accented text-highlighted hover:bg-accented' : '',
						highlightIndex === row.flatIndex ? 'ring-2 ring-inset ring-primary' : '',
					]"
					@click="selectOption(row.option.id)"
					@mouseenter="highlightIndex = row.flatIndex"
				>
					<span class="truncate">{{ row.option.name }}</span>
					<Icon
						v-if="row.option.id === modelValue"
						name="i-lucide-check"
						class="h-4 w-4 shrink-0"
						aria-hidden="true"
					/>
				</button>
			</template>
		</div>
	</div>
</template>
