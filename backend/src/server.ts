// TODO remove js extensions

import express, { Request, Response } from 'express'
import cors from 'cors'
import { fetchAndUpload } from './uploadImage.js'
import { createCollection, getCollections } from './collecitons.js'
import { createPin, discardTmpFile, getImageUrl, getImages, fetchAndAdd, addFile } from './images.js'
import fileUpload from 'express-fileupload'
import { CLIENT_URL } from './globals.js'
import { Endpoints } from './endpoints.js'

const PORT = 3000

const app = express()

const corsOptions = {
	origin: [CLIENT_URL],
}

app.use(cors(corsOptions))
app.use(fileUpload())

function panic(res: express.Response<any, Record<string, any>>, message: string = `Internal Server Error`) {
	res.status(500)
	res.send(message)
}

app.get('/', (req: Request, res: Response) => {
	res.send({ text: 'Hello World from TypeScript server!' })
})

app.get(Endpoints.GetCollections, async (req: Request, res: Response) => {
	res.send(await getCollections())
})

app.get(Endpoints.Upload, async (req: Request, res: Response) => {
	try {
		const url = req.query.url
		if (!url || typeof url !== 'string') {
			throw new Error('Invalid request')
		}
		const ref = await fetchAndUpload(url)
		res.send({ ref })
	} catch (error) {
		return panic(res, `Internal Server Error ${error}`)
	}
})

app.get('/create-collection', async (req: Request, res: Response) => {
	const url = req.query.name
	if (isString(url)) {
		return res.send(await createCollection(url))
	}
	return panic(res)
})

app.get('/upload-image', async (req: Request, res: Response) => {
	const url = req.query.url
	if (!isString(url)) {
		return panic(res)
	}
	try {
		return res.send(await fetchAndAdd(url))
	} catch (error) {
		return panic(res)
	}
})

app.get('/discard-image', async (req: Request, res: Response) => {
	const id = req.query.id
	if (!isString(id)) {
		return panic(res)
	}
	try {
		return res.send(await discardTmpFile(id))
	} catch (error) {
		return panic(res)
	}
})

app.get('/get-image', async (req: Request, res: Response) => {
	const id = req.query.id
	if (!isString(id)) {
		return panic(res)
	}
	try {
		return res.send({ url: await getImageUrl(id) })
	} catch (error) {
		return panic(res)
	}
})

// TODO error handling
app.post('/upload-image-file', async (req: Request, res: Response) => {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files were uploaded.')
	}
	if (Array.isArray(req.files.file)) {
		return panic(res)
	}
	const res1 = await addFile(req.files.file)
	return res.send(res1)
})

app.get('/create-pin', async (req: Request, res: Response) => {
	const imageId = req.query.imageId
	if (!isString(imageId)) {
		return panic(res)
	}
	const collectionId = req.query.collectionId
	if (!isString(collectionId)) {
		return panic(res)
	}
	const res2 = await createPin(imageId, collectionId)
	return res.send(res2)
})

app.get('/get-images', async (req: Request, res: Response) => {
	const collectionId = req.query.collectionId
	if (!isString(collectionId)) {
		return panic(res)
	}
	const res2 = await getImages(collectionId)
	return res.send(res2)
})

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`)
})

function isString(p: any): p is string {
	return typeof p === 'string'
}
