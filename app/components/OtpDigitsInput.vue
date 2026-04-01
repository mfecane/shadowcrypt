<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

const props = withDefaults(
	defineProps<{
		modelValue: string
		id?: string
	}>(),
	{ id: undefined },
)

const emit = defineEmits<{
	'update:modelValue': [value: string]
}>()

const digits = ref<string[]>(['', '', '', '', '', ''])

watch(
	() => props.modelValue,
	(v) => {
		const cleaned = v.replace(/\D/g, '').slice(0, 6)
		if (cleaned === digits.value.join('')) {
			return
		}
		for (let i = 0; i < 6; i++) {
			digits.value[i] = cleaned[i] ?? ''
		}
	},
	{ immediate: true },
)

function emitDigits(): void {
	emit('update:modelValue', digits.value.join(''))
}

const digitIndices = [0, 1, 2, 3, 4, 5] as const

const inputEls = ref<(HTMLInputElement | null)[]>(
	Array.from({ length: 6 }, () => null as HTMLInputElement | null),
)

function setInputRef(
	el: Element | ComponentPublicInstance | null,
	i: number,
): void {
	if (el instanceof HTMLInputElement) {
		inputEls.value[i] = el
	} else if (el === null) {
		inputEls.value[i] = null
	}
}

function onInput(i: number, e: Event): void {
	const target = e.target as HTMLInputElement
	const val = target.value.replace(/\D/g, '')
	if (val.length > 1) {
		const chars = val.slice(0, 6 - i).split('')
		for (let k = 0; k < chars.length && i + k < 6; k++) {
			digits.value[i + k] = chars[k]!
		}
		const nextFocus = Math.min(i + chars.length, 5)
		void nextTick(() => inputEls.value[nextFocus]?.focus())
		emitDigits()
		return
	}
	digits.value[i] = val
	if (val && i < 5) {
		void nextTick(() => inputEls.value[i + 1]?.focus())
	}
	emitDigits()
}

function onKeydown(i: number, e: KeyboardEvent): void {
	if (e.key === 'Backspace') {
		if (digits.value[i] === '' && i > 0) {
			digits.value[i - 1] = ''
			void nextTick(() => inputEls.value[i - 1]?.focus())
			emitDigits()
			e.preventDefault()
			return
		}
		if (digits.value[i] !== '') {
			digits.value[i] = ''
			emitDigits()
		}
	}
	if (e.key === 'ArrowLeft' && i > 0) {
		inputEls.value[i - 1]?.focus()
		e.preventDefault()
	}
	if (e.key === 'ArrowRight' && i < 5) {
		inputEls.value[i + 1]?.focus()
		e.preventDefault()
	}
}

function onPaste(e: ClipboardEvent): void {
	e.preventDefault()
	const text = e.clipboardData?.getData('text') ?? ''
	const cleaned = text.replace(/\D/g, '').slice(0, 6)
	for (let j = 0; j < 6; j++) {
		digits.value[j] = cleaned[j] ?? ''
	}
	emitDigits()
	const focusIdx = cleaned.length === 0 ? 0 : Math.min(cleaned.length, 5)
	void nextTick(() => inputEls.value[focusIdx]?.focus())
}
</script>

<template>
	<div
		class="flex justify-center gap-2"
		role="group"
		aria-label="Verification code"
		@paste.capture.prevent="onPaste"
	>
		<input
			v-for="i in digitIndices"
			:id="i === 0 ? id : undefined"
			:key="i"
			:ref="(el) => setInputRef(el, i)"
			:value="digits[i]"
			type="text"
			inputmode="numeric"
			pattern="[0-9]*"
			maxlength="1"
			class="ring ring-inset ring-default focus:ring-primary flex h-12 w-10 rounded-md border-0 bg-elevated
				text-center text-lg font-mono tabular-nums text-highlighted outline-none"
			:autocomplete="i === 0 ? 'one-time-code' : 'off'"
			:aria-label="'Digit ' + (i + 1) + ' of 6'"
			@input="onInput(i, $event)"
			@keydown="onKeydown(i, $event)"
		>
	</div>
</template>
