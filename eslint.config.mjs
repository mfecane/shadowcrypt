import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
	files: ['**/*.ts', '**/*.tsx'],
	rules: {
		'@typescript-eslint/consistent-type-imports': 'off',
		'vue/html-self-closing': 'off',
	},
	ignores: ['node_modules', 'dist', 'webpack.config.js', 'webpack'],
})
