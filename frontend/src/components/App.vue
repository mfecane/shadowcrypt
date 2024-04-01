<template>
	<DragWrapper>
		<div class='content'>
			<router-view />
		</div>
		<CreateButton />
		<DialogRoot />
	</DragWrapper>
	<Create />
	<Quickfind />
</template>

<script lang="ts" setup>

import Create from '@/components/create/Create.vue'
import CreateButton from '@/components/common/CreateButton.vue'
import DragWrapper from '@/components/drag/DragWrapper.vue'
import DialogRoot from '@/components/dialogs/DialogRoot.vue'

import { onMounted } from 'vue'

import { useAuthWatcher } from '@/hooks/useAuth'
import { setupEvent } from '@/hooks/interaction/useQuickfind'
import Quickfind from './quickfind/Quickfind.vue'
import { listenPaste } from '@/hooks/useUploadDialog'


onMounted(() => setupEvent())

useAuthWatcher()

listenPaste()

</script>

<style scoped lang="scss"></style>