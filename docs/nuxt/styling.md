# Nuxt + Tailwind + Nuxt UI styling

## 1. Put design tokens in CSS

With current Nuxt UI, the preferred approach is CSS-first theming with Tailwind v4–style tokens in your main stylesheet, not stuffing everything into a Tailwind config file. Nuxt’s styling docs place local styles under `app/assets/`, and Nuxt UI’s design system docs show `@import "tailwindcss";`, `@import "@nuxt/ui";`, then `@theme { ... }` for your tokens.

`app/assets/css/main.css`

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
	--color-primary-500: oklch(0.62 0.18 262);
	--radius-sm: 0.375rem;
	--radius-md: 0.625rem;
	--radius-lg: 0.875rem;
}
```

Colors, radius, spacing-ish design decisions, and typography tokens live here.

## 2. Put app-wide component defaults in app.config.ts

Nuxt UI components are built around slots, variants, and class merging. Global component customization belongs in `app.config.ts`: how the app wants UButton, UInput, UCard, and similar components to look by default.

```ts
// app.config.ts
export default defineAppConfig({
	ui: {
		button: {
			defaultVariants: {
				color: 'primary',
				variant: 'solid',
				size: 'md',
			},
		},
		card: {
			slots: {
				root: 'rounded-xl',
				body: 'p-6',
			},
		},
	},
})
```

Default look of library components goes here.

## 3. Props first, ui second, raw classes last

Nuxt UI’s first layer is the component API (color, variant, size, icon, slots). Use the ui prop for slot-level overrides. Only then use ad-hoc Tailwind classes. That keeps styling consistent and easier to refactor.

```vue
<UButton
	color="primary"
	variant="subtle"
	size="lg"
	:ui="{ base: 'font-semibold', leadingIcon: 'size-5' }"
/>
```

Rule of thumb:

- Props for semantic styling
- app.config.ts for shared defaults
- ui prop for component-specific overrides
- class for layout and one-off local tweaks

## 4. Keep layout classes in templates, not in theme config

Things like flex, grid, gap-4, mx-auto, max-w-7xl are page/layout concerns. Keep those in the SFC template. Do not bury layout decisions inside global theme overrides unless they are truly component defaults. That matches Nuxt’s styling model and keeps component theming separate from page composition.

## 5. Wrap repeated patterns into your own components

If you keep repeating the same UCard + UButton + UBadge combination, add components/AppCard.vue or AppSection.vue. Idiomatic Nuxt is not “style every screen inline forever”; it is “compose app-specific components on top of Nuxt UI.” Nuxt UI provides primitives and themed components, not your final design system.

Example layout:

```text
app/
  assets/css/main.css    # tokens, globals
  app.config.ts            # global Nuxt UI component defaults
components/
  app/
    AppButton.vue
    AppCard.vue
    AppPageHeader.vue
pages/
```

## 6. Use globals sparingly

Global CSS should mostly be:

- Tokens
- Reset/base rules
- Typography defaults
- Truly app-wide utility classes

Do not recreate a large legacy CSS architecture unless you have a strong reason. Nuxt UI already expects Tailwind utilities plus component theming.

## 7. Subtree-wide overrides: theme scoping

Nuxt UI provides a Theme component for overriding child component themes in one subtree. Use it when one area of the app needs a slightly different feel without redefining every instance.

## Practical hierarchy

- main.css: design tokens
- app.config.ts: global Nuxt UI defaults
- Your wrapper components: app design system
- Page template classes: layout
- One-off ui / class overrides: exceptions

That is the cleanest, most idiomatic way to combine Nuxt, Tailwind, and Nuxt UI today.
