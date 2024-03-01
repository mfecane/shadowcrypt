<template >
	<DragWrapper>
		<div class='content'>
			<router-view />
		</div>
		<CreateButton />
	</DragWrapper>
	<Create />
	<Auth />
	<Quickfind />
</template>

<script lang="ts" setup>

import Auth from '@/components/auth/Auth.vue'
import Create from '@/components/create/Create.vue'
import CreateButton from '@/components/common/CreateButton.vue'
import DragWrapper from '@/components/drag/DragWrapper.vue'

import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuth, useAuthWatcher } from '@/hooks/useAuth'
import { useCollectionsLocal } from '../hooks/useCollectionsLocal'
import { usePaste } from '@/hooks/usePaste'
import { setupEvent } from '@/hooks/interaction/useQuickfind'
import Quickfind from './quickfind/Quickfind.vue'


onMounted(() => {
	setupEvent()
})

useAuthWatcher()
usePaste()

const { user } = storeToRefs(useAuth())

const { reloadCollections } = useCollectionsLocal()

watch(user, () => reloadCollections())

</script>

<style scoped lang="scss"></style>