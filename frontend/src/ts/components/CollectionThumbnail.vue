
<template>
	<router-link :to="'/collections/' + props.collection.id">
		<div class='item'>
			<div class='item__header-container'>
				<div class='item__name'>{{ props.collection.name }}</div>
				<div class='item__count'>{{ props.collection.images.length }} items</div>
				<Icon v-if="props.collection.pinned" :type="IconType.pin" :size="2" />
			</div>
			<div class="item__wrapper">
				<div v-if="displayImages.length" class="item__grid" :class="itemGridStyles">
					<div v-for="(image, index) in displayImages" :class="getClassnameForImage(index)" key={index}>
						<img v-if="image.path" :src="image.path" class='item__image' />
						<span v-else></span>
					</div>

				</div>
				<div v-else class="empty">Nothing</div>
				<CollectionOptions class="collection-options" />
			</div>
		</div>
	</router-link>
</template>

<script setup lang="ts">

import Icon from './common/icons/Icon.vue';

import { computed } from 'vue';
import { CollectionWithImages } from '../model/Data';
import CollectionOptions from './list/CollectionOptions.vue';
import { IconType } from './common/icons/IconType';

const props = defineProps<{ index: number, collection: CollectionWithImages }>()


let displayImagesCount: number
const itemGridStyles: string[] = []

const displayImages = computed(() => {
	if (!props.collection.images.length) {
		return []
	}
	let arr = props.collection.images.slice(0, displayImagesCount)
	if (arr.length < displayImagesCount) {
		arr = arr.concat(
			new Array(displayImagesCount - arr.length).fill({
				src: undefined,
			})
		)
	}
	return arr
})

switch (props.index) {
	case 0:
		displayImagesCount = 5
		itemGridStyles.push('item--grid-5x')
		// itemStyles += ' ' + style['item--grid-5x']
		break
	case 1:
		displayImagesCount = 3
		break
	case 2:
	default:
		displayImagesCount = 3
		break
}

const getClassnameForImage = (index: number): string[] => {

	const imageGridStyles: string[] = ['item__image-container']

	if (displayImagesCount === 5 && index === 0) {
		imageGridStyles.push('item-5-images__image--span-h-v')
	}

	if (displayImagesCount === 5 && index === 2) {
		imageGridStyles.push('item-5-images__image--span-v')
	}

	if (displayImagesCount === 3 && index === 0) {
		imageGridStyles.push('item-3-images__image-first')
	}

	return imageGridStyles
}


</script>

<style scoped lang="scss">
.item {
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.item__header-container {
	flex: 0 0 26px;
	display: flex;
	flex-direction: column;
	grid-template-columns: auto 32px;
	position: relative;
}

.item__header-container :deep(svg) {
	position: absolute;
	right: 0;

	path {
		fill: var(--color-light3);
	}
}

.item__header-data {
	display: flex;
	flex-direction: column;
}

.item__name {
	color: #000;
	font-size: 16px;
	font-weight: 600;
	color: var(--color-light);
	margin-bottom: 8px;
}

.item__count {
	font-size: 12px;
	font-weight: 500;
	color: var(--accent-color);
	margin-bottom: 8px;
}

.item__wrapper {
	flex: 0 1 auto;
	min-width: 0;
	min-height: 0;
	background: var(--bg-color-dark);
	position: relative;
	padding: 5px;
	border-radius: 4px;
	box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.1), 1px 1px 2px 0px rgba(0, 0, 0, 0.1);
}


.item__grid {
	height: 100%;
	flex: 0 1 auto;
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	grid-template-rows: 1fr 1fr;
	gap: 1px;
	transition: 200ms ease-out all;
}

.item__grid.item--grid-5x {
	grid-template-columns: repeat(2, 2fr) 3fr;
	grid-template-rows: 3fr 1fr 2fr;
}

.item-5-images__image--span-h-v {
	grid-column-start: span 2;
	grid-row-start: span 2;
}

.item-5-images__image--span-v {
	grid-row-start: span 2;
}

.item-3-images__image-first {
	grid-column-start: span 2;
}

.upper-grid .item__name {
	font-size: 18px;
	font-weight: 500;
}

.item__image-container {
	overflow: hidden;
}

.item__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.collection-options {
	position: absolute;
	z-index: 1;
	bottom: 12px;
	right: 12px;
	opacity: 0;
	transition: opacity 200ms ease;
	pointer-events: none;
}

.item:hover .collection-options {
	opacity: 1;
	pointer-events: all;
}

.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 160px;
	color: var(--color-light);
}
</style>