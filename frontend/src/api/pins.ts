import { HOST } from './common'

export async function deletePin(id: string) {
	const response = await fetch(`${HOST}/pin/${id}`, { method: 'DELETE' })
	if (!response.ok) {
		throw new Error('Failed to delete pin')
	}
}
