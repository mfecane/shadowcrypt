import { AdminJob } from '~/types/adminJobs'

const ADMIN_JOBS: AdminJob[] = [
	new AdminJob(
		'cleanupOrphanFiles',
		'Cleanup Orphan Files',
		'Finds files in storage that are not referenced in the database and deletes them',
		'cleanup-orphan-files'
	),
]

export function useAdminJobsList() {
	const filter = ref('')
	const checkedIds = ref(new Set<string>())

	const filteredJobs = computed(() => ADMIN_JOBS.filter((job) => job.matches(filter.value)))
	const checkedJobs = computed(() => ADMIN_JOBS.filter((job) => checkedIds.value.has(job.id)))
	const allChecked = computed(
		() => filteredJobs.value.length > 0 && filteredJobs.value.every((job) => checkedIds.value.has(job.id))
	)

	function toggle(job: AdminJob): void {
		const next = new Set(checkedIds.value)
		if (next.has(job.id)) {
			next.delete(job.id)
		} else {
			next.add(job.id)
		}
		checkedIds.value = next
	}

	function toggleAll(): void {
		checkedIds.value = allChecked.value ? new Set() : new Set(filteredJobs.value.map((job) => job.id))
	}

	return { jobs: ADMIN_JOBS, filter, filteredJobs, checkedIds, checkedJobs, allChecked, toggle, toggleAll }
}
