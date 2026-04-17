import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { CollectionsListResponse } from '~/types/collections'

export const collectionsQueryKey = ['collections'] as const

const COLLECTIONS_STALE_TIME_MSEC = 60_000

export function useCollectionsListQuery(enabled: MaybeRefOrGetter<boolean> = true) {
	return useQuery({
		queryKey: collectionsQueryKey,
		queryFn: () => $fetch<CollectionsListResponse>('/api/collections'),
		staleTime: COLLECTIONS_STALE_TIME_MSEC,
		refetchOnMount: false,
		enabled: computed(() => toValue(enabled)),
	})
}
