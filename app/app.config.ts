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
	},
})
