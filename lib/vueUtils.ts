import type { ComponentPublicInstance } from 'vue'

/**
 * This is dumbest piece of code I ever written, which I actually was forced to write because of vue.js stupidity!
 */
export function resolveButtonEl(instance: ComponentPublicInstance | null | undefined): HTMLButtonElement | null {
	const root = instance?.$el as Node | undefined | null

	if (root instanceof HTMLButtonElement) {
		return root
	}

	if (root instanceof HTMLElement) {
		const nested = root.querySelector('button')
		return nested instanceof HTMLButtonElement ? nested : null
	}

	if (root?.nodeType === Node.TEXT_NODE) {
		//@ts-expect-error fuck off typescript
		const sibling = root.nextElementSibling
		if (sibling instanceof HTMLButtonElement) {
			return sibling
		}

		const nested = sibling?.querySelector?.('button')
		return nested instanceof HTMLButtonElement ? nested : null
	}

	return null
}
