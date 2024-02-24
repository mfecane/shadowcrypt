import { info } from 'firebase-functions/logger'
import { createWriteStream } from 'fs'
import { unlink } from 'fs/promises'
import { Readable } from 'stream'
import { finished } from 'stream/promises'

import { bucket } from './firebase'
import { USER_AGENT } from './globals'

const TMP_FILE = './image.tmp'

const FOLDER = 'images'

export function uploadImage(url: string) {}

export async function fetchAndUpload(url: string): Promise<string> {
	const filename = getFileName(url.trim())
	await fetchImage(url)
	const path = `${FOLDER}/${filename}`
	await uploadData(path)
	await unlink(TMP_FILE)
	return path
}

async function fetchImage(url: string): Promise<void> {
	info(`get ${url}`)

	const options = {
		method: 'GET',
		headers: {
			'User-Agent': USER_AGENT,
		},
	}

	const stream = createWriteStream(TMP_FILE)
	const { body } = await fetch(url, options)
	if (!body) {
		throw new Error('Failed to fetch image')
	}

	//@ts-expect-error
	await finished(Readable.fromWeb(body).pipe(stream))
}

function getFileName(url: string): string {
	const regex = /\/([^\/]+)\.(\w+)(?:[\?#].*)?$/
	const matches = url.match(regex)

	if (!matches || !matches.length) {
		throw new Error('Incorrect file name')
	}

	const extension = matches[2]

	if (extension.toLowerCase() !== 'jpg') {
		throw new Error('Incorrect file extension')
	}

	return matches[1] + '.' + extension
}

async function uploadData(path: string): Promise<string> {
	info(`save ${path}`)
	await bucket.upload(TMP_FILE, { destination: path })
	return path
}
