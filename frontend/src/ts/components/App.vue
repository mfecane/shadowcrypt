<template >
	<DragWrapper>
		<div className='content'>
			<router-view />
		</div>
		<CreateButton />
	</DragWrapper>
	<Create />
	<Auth />
</template>

<script lang="ts" setup>

import Auth from '@/ts/components/auth/Auth.vue'
import Create from '@/ts/components/create/Create.vue'
import CreateButton from '@/ts/components/common/CreateButton.vue'
import DragWrapper from '@/ts/components/drag/DragWrapper.vue'

import { watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthWatcher } from '../hooks/useAuth'
import { useAuth } from '@/ts/hooks/useAuth'
import { useCollectionsLocal } from '../hooks/useCollectionsLocal'

useAuthWatcher()

const { user } = storeToRefs(useAuth())

const { reloadCollections } = useCollectionsLocal()

watch(user, () => reloadCollections())

</script>

<style scoped lang="scss"></style>