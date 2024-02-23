

<template>
	<div class='header-content' ref="header">
		<div class='container header-content2'>
			<div class="logo-and-search">
				<Logo />
				<div class="header-content__search">
					<SearchBar hint="Search your pins" v-model="filter" />
				</div>
			</div>
			<User />
		</div>
	</div>
</template>

<script setup lang="ts">

import User from '@/ts/components/auth/User.vue';
import Logo from '@/ts/components/common/Logo.vue'
import SearchBar from '@/ts/components/common/inputs/SearchBar.vue'

import { ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';

import { useCollectionList } from '@/ts/hooks/useCollectionList';

const { filter } = storeToRefs(useCollectionList())

const header = ref<HTMLDivElement>()

watchEffect(() => {
	const el = header.value!

	const scrollHander = () => {
		const scroll = document.documentElement.scrollTop
		if (scroll > 10) {
			el.classList.toggle('darkbg', true)
		} else {
			el.classList.toggle('darkbg', false)
		}
	}

	window.addEventListener('scroll', scrollHander)
})

</script>

<style scoped lang="scss">
.header-content {
	position: sticky;
	top: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: background-color 100ms ease;
	z-index: 1;

	&.darkbg {
		background-color: var(--bg-color-dark);
	}

}

.header-content2 {
	width: 100%;
	padding: 16px 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
}


.logo-and-search {
	flex: 1 0 auto;
	display: flex;
	align-items: center;
}

.logo-and-search>*:first-child {
	margin-right: 24px;
}

.header-content__logo {
	flex: 0 0 30px;
	height: 30px;
	border-radius: 20px;
	background: var(--accent-color);
}

.header-content__search {
	flex: 1 0 400px;
	max-width: 600px;
}

.header-content__name {
	color: var(--accent-color);
	font-weight: bold;
	font-size: 16px;
}

.header-content__face {
	flex: 0 0 30px;
	width: 30px;
	height: 30px;
	border-radius: 20px;
	background: var(--accent-color);
}

.header__login {
	display: flex;
	gap: 12px;
	margin: 40px 0;
}

.user {
	flex: 1 0 auto;
	max-width: fit-content;
	display: flex;
	align-items: center;

	&>*:first-child {
		flex: 0 0 auto;
		margin-right: 12px;
	}
}
</style>