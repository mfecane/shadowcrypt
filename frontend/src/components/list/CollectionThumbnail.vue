<template>
	<router-link :to="'/collections/' + props.collection.id">
		<div class='item' ref="item">
			<CollectionHeader :collection="props.collection" :pinned="props.collection.pinned ?? false"
				:name="props.collection.name" :count="props.collection.images.length" :big="props.big"
				:collectionId="props.collection.id" />
			<div class="item__wrapper">
				<div v-if="displayImages.length" class="item__grid" :class="props.big ? 'big' : 'small'">
					<div v-for="(image, index) in displayImages" key={image.id}>
						<img v-if="image.path" :src="image.path" class='item__image' @dragstart.prevent="onDragStart" />
						<span v-else></span>
					</div>
				</div>
				<div v-else class="empty">Nothing</div>
			</div>
		</div>
	</router-link>
</template>

<script setup lang="ts">

import CollectionHeader from './CollectionHeader.vue'

import { computed, ref } from 'vue';
import { CollectionWithImages } from '../../model/Data'

const props = withDefaults(
	defineProps<{ big?: boolean, collection: CollectionWithImages }>(),
	{ big: false }
)

const item = ref<HTMLDivElement>()

const displayImages = computed(() => {
	if (!props.collection.images.length) {
		return []
	}
	return props.collection.images.slice(0, 5)
})

function onDragStart(event: DragEvent) {
	event.stopPropagation()
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


.item__wrapper {
	flex: 1 1 auto;
	min-width: 0;
	min-height: 0;
	background: var(--color-darker);
	position: relative;
	padding: 5px;
	border-radius: 4px;
	box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.3);
}

.item__grid {
	height: 100%;
	flex: 0 1 auto;
	display: grid;
	gap: 1px;
	transition: 200ms ease-out all;

	div {
		overflow: hidden;
	}

	&.big {
		grid-template-columns: repeat(2, 2fr) 3fr;
		grid-template-rows: 3fr 1fr 2fr;

		&>*:first-child {
			grid-column-start: span 2;
			grid-row-start: span 2;
		}

		&>*:nth-child(3) {
			grid-row-start: span 2;
		}

		&>*:nth-child(n + 6) {
			display: none;
		}
	}

	&.small {
		grid-template-columns: 3fr 2fr;
		grid-template-rows: 1fr 1fr;

		&>*:first-child {
			grid-row-start: span 2;
		}

		&>*:nth-child(n + 4) {
			display: none;
		}
	}
}

.item__image-container {
	overflow: hidden;
}

.item__image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 160px;
	color: var(--color-light);
}
</style>../../model/Data