import { ImageCropperEngine } from '~~/lib/imageCropper/ImageCropperEngine'
import type { CropArea } from '~~/lib/imageCropper/types'

export type { CropArea } from '~~/lib/imageCropper/types'

type UseImageCropperResult = {
	containerEl: Ref<HTMLDivElement | null>
	canvasAspectRatio: Ref<number | null>
}

/**
 * Bridges ImageCropperEngine (the Pixi crop canvas) into Vue: mounts/destroys
 * the engine on the container element and mirrors its natural-image aspect
 * ratio into state, so the container can be sized to match once known.
 * `aspectRatio === null` makes the crop rect itself freeform.
 */
export function useImageCropper(
	image: Ref<string>,
	aspectRatio: Ref<number | null>,
	onCropComplete: (area: CropArea) => void
): UseImageCropperResult {
	const containerEl = ref<HTMLDivElement | null>(null)
	const canvasAspectRatio = ref(aspectRatio.value)

	let engine: ImageCropperEngine | null = null
	let readyController: AbortController | null = null
	let cropController: AbortController | null = null

	function unmount(): void {
		readyController?.abort()
		cropController?.abort()
		engine?.destroy()
		engine = null
	}

	function mount(node: HTMLDivElement, imageUrl: string, ratio: number | null): void {
		engine = new ImageCropperEngine(ratio)
		readyController = engine.addOnReadyListener((naturalAspectRatio) => {
			canvasAspectRatio.value = naturalAspectRatio
		})
		cropController = engine.addOnCropChangeListener(onCropComplete)
		void engine.mount(node, imageUrl)
	}

	watch(
		[containerEl, image, aspectRatio],
		([node, imageUrl, ratio]) => {
			unmount()
			if (node !== null) {
				mount(node, imageUrl, ratio)
			}
		},
		{ immediate: true }
	)

	onBeforeUnmount(unmount)

	return { containerEl, canvasAspectRatio }
}
