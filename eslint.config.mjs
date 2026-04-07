import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
	files: ['**/*.ts', '**/*.vue'],
	rules: {
		'@typescript-eslint/consistent-type-imports': 'off',
		'vue/html-self-closing': 'off',
		'vue/attributes-order': 'off',
	},
	ignores: ['node_modules', 'dist', 'webpack.config.js', 'webpack'],
})
