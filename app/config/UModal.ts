export default {
	slots: {
		content: 'bg-elevated',
	},
	variants: {
		overlay: {
			true: {
				overlay: 'bg-neutral-950/60 backdrop-blur-sm',
			},
		},
	},
}
