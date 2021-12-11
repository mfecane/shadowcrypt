import fetch from 'node-fetch'
import { storage } from './firebase.js'
import { ref, uploadBytes } from 'firebase/storage'
import { UploadedFile } from 'express-fileupload'

const USER_AGENT =
	'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'

const FOLDER = 'images'

export async function fetchAndUpload(url: string): Promise<string> {
	const [filename, error] = getFileName(url.trim())
	if (error) {
		throw error
	}
	const data = await fetchImage(url)
	return uploadData(filename, data)
}

export async function uploadImage(file: UploadedFile) {
	if (!validateFilename(file.name)) {
		throw 'Incorrect file name'
	}
	return uploadData(file.name, file.data)
}

async function fetchImage(url: string): Promise<Buffer> {
	const options = {
		method: 'GET',
		headers: {
			'User-Agent': USER_AGENT,
		},
	}
	const response = await fetch(url, options)
	return Buffer.from(await response.arrayBuffer())
}

async function uploadData(filename: string, data: Buffer): Promise<string> {
	const path = `${FOLDER}/${filename}`
	const imagesRef = ref(storage, path)
	// TODO handle error
	await uploadBytes(imagesRef, data)
	return path
}

function getFileName(url: string): [filename: string, error: null] | [filename: null, error: Error] {
	const regex = /\/([^\/]+)\.(\w+)(?:[\?#].*)?$/
	const matches = url.match(regex)

	if (!matches || !matches.length) {
		return [null, new Error('Incorrect file name')]
	}

	const extension = matches[2]

	if (extension.toLowerCase() !== 'jpg') {
		return [null, new Error('Incorrect file extension')]
	}

	return [matches[1] + '.' + extension, null]
}

function validateFilename(name: string): boolean {
	const regex = /([^\/]+)\.(\w+)$/
	const matches = name.match(regex)
	if (!matches || !matches.length) {
		return false
	}
	const extension = matches[2]
	return extension.toLowerCase() === 'jpg'
}
