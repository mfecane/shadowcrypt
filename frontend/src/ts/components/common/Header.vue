

<template>
	<div class='header-content'>
		<div class="logo-and-search">
			<Logo />
			<div class="header-content__search">
				<SearchBar hint="Search your pins" v-model="collectionList.filter" />
			</div>
		</div>
		<div class="user">
			<div class='header-content__name'>Mfecane</div>
			<div class='header-content__face'></div>
		</div>
	</div>
</template>

<script setup lang="ts">

import Logo from '@/ts/components/common/Logo.vue'
import SearchBar from '@/ts/components/common/inputs/SearchBar.vue'
import { useCollectionList } from '@/ts/hooks/useCollectionList';

const collectionList = useCollectionList()

</script>

<style scoped lang="scss">
.header-content {
	height: 80px;
	overflow: hidden;
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