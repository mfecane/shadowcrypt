<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import type { CollectionBoardSummary } from '~/types/boards';
import { fetchFormErrorMessage } from '~~/lib/fetchFormErrorMessage';

const props = defineProps<{ collectionId: string }>()

const router = useRouter()
const queryClient = useQueryClient()
const toast = useToast()

const creating = ref(false)

async function createBoard(): Promise<void> {
	creating.value = true
	try {
		const res = await $fetch<{ board: CollectionBoardSummary }>(
			`/api/collections/${props.collectionId}/boards`,
			{ method: 'POST' }
		)
		await queryClient.invalidateQueries({ queryKey: ['collection', props.collectionId] })
		void router.push(`/collections/${props.collectionId}/boards/${res.board.id}`)
	} catch (e: unknown) {
		toast.add({ title: fetchFormErrorMessage(e, 'Could not create board'), color: 'error' })
	} finally {
		creating.value = false
	}
}
</script>

<template>
	<UTooltip text="New board">
		<UButton data-id="boards-sidebar-new" icon="i-lucide-plus" size="md" color="neutral" variant="ghost"
			aria-label="New board" :loading="creating" @click="createBoard" />
	</UTooltip>
</template>
