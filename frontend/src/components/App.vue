<template >
	<DragWrapper>
		<div class='content'>
			<router-view />
		</div>
		<CreateButton />
	</DragWrapper>
	<Create />
	<Auth />
</template>

<script lang="ts" setup>

import Auth from '@/components/auth/Auth.vue'
import Create from '@/components/create/Create.vue'
import CreateButton from '@/components/common/CreateButton.vue'
import DragWrapper from '@/components/drag/DragWrapper.vue'

import { watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthWatcher } from '../hooks/useAuth'
import { useAuth } from '@/hooks/useAuth'
import { useCollectionsLocal } from '../hooks/useCollectionsLocal'
import { usePaste } from '@/hooks/usePaste'

useAuthWatcher()
usePaste()

const { user } = storeToRefs(useAuth())

const { reloadCollections } = useCollectionsLocal()

watch(user, () => reloadCollections())

</script>

<style scoped lang="scss"></style>