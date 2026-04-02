export default defineAppConfig({
	ui: {
		colors: {
			primary: 'beige',
			neutral: 'neutral',
		},
		card: {
			variants: {
				variant: {
					outline: {
						root: 'rounded-md',
					},
				},
			},
		},
		button: {
			variants: {
				ghost: {
					root: 'disabled: text-muted',
				},
				soft: {
					root: 'text-primary disabled:text-neutral-500 hover:bg-neutral-700 disabled:bg-neutral-600',
				},
			},
		},
		switch: {
			slots: {
				base: 'data-[state=unchecked]:bg-neutral-900',
				thumb: 'bg-neutral-500',
			},
		},
	},
})
