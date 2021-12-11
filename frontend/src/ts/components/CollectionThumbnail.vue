
<template>
  <router-link :to="'/collections/' + props.collection.id">
    <div class='item'>
      <div class='item__header-container'>
        <div class='item__name'>{{ props.collection.name }}</div>
        <div class='item__header-menu'></div>
        <div class='item__count'>{{ props.collection.images.length }} items</div>
      </div>
      <div class="item__grid" :class="itemGridStyles">
        <div v-for="(image, index) in displayImages" :class="getClassnameForImage(index)" key={index}>
          <img :src="image.path" class='item__image' v-if="image.path" />
          <span v-else></span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { CollectionWithImages } from '../model/Data';
import { ImageCollection } from '../model/components/images-list';


const props = defineProps<{ index: number, collection: CollectionWithImages }>()


let displayImagesCount: number
const itemGridStyles: string[] = []

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

let displayImages = props.collection.images.slice(0, displayImagesCount)

if (displayImages.length < displayImagesCount) {
  displayImages = displayImages.concat(
    new Array(displayImagesCount - displayImages.length).fill({
      src: undefined,
    })
  )
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
  display: grid;
  grid-template-columns: auto 32px;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0;
}

.item__name {
  color: #000;
  font-size: 14px;
  font-weight: 600;
}

.item__count {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-light);
}

.item__header-menu {
  grid-row-start: span 2;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background: #ccc;
}

.item__grid {
  min-width: 0;
  min-height: 0;
  background: #fff;
  flex: 0 1 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  padding: 4px;
  border: 1px solid rgb(202, 208, 209);
  border-radius: 3px;
  box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.1);
  transition: 200ms ease-out all;
}

.item:hover .item__grid {
  box-shadow: 0px 0px 10px 1px rgb(30, 162, 172);
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
  color: #000;
  font-size: 16px;
  font-weight: 600;
}

.upper-grid .item__header-menu {
  height: 30px;
  width: 30px;
  border-radius: 15px;
}

.item__image-container {
  overflow: hidden;
}

.item__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>