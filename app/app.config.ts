import UButton from './config/UButton'
import UInput from './config/UInput'
import UModal from './config/UModal'

export default defineAppConfig({
	ui: {
		colors: {
			primary: 'beige',
			neutral: 'neutral',
		},
		card: {
			slots: {
				root: 'rounded-md',
				body: 'p-2 sm:p-2 h-full',
			},
			variants: {
				variant: {
					outline: {
						root: 'rounded-md',
					},
				},
			},
		},
		button: UButton,
		switch: {
			slots: {
				base: 'data-[state=unchecked]:bg-neutral-900',
				thumb: 'bg-neutral-500',
			},
		},
		modal: UModal,
		formField: {
			slots: {
				root: 'space-y-2',
			},
		},
		input: UInput,
	},
})
