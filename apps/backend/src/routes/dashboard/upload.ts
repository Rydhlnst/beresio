import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'

type R2BucketLike = {
    put: (
        key: string,
        value: ArrayBuffer | ArrayBufferView | string,
        options?: {
            httpMetadata?: { contentType?: string }
            customMetadata?: Record<string, string>
        }
    ) => Promise<unknown>
}

type Bindings = {
    DATABASE_URL: string
    BETTER_AUTH_SECRET: string
    BETTER_AUTH_URL: string
    UPLOAD_PROVIDER?: string
    R2_PUBLIC_BASE_URL?: string
    R2_UPLOADS?: R2BucketLike
    CLOUDINARY_CLOUD_NAME?: string
    CLOUDINARY_API_KEY?: string
    CLOUDINARY_UPLOAD_PRESET?: string
}
type Variables = { db: any; user: any; session: any }

const imageUploadSchema = z.object({
    image: z
        .string()
        .min(1, 'Image data is required')
        .startsWith('data:image/', 'Invalid image format. Must be base64 data URI'),
    folder: z.string().trim().min(1).max(120).default('products'),
})

const multipleImageUploadSchema = z.object({
    images: z
        .array(
            z.string().min(1).startsWith('data:image/', 'Invalid image format. Must be base64 data URI')
        )
        .min(1, 'Upload 1-5 images at a time')
        .max(5, 'Upload 1-5 images at a time'),
    folder: z.string().trim().min(1).max(120).default('products'),
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

const mimeToExtension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

function sanitizeFolder(folder: string) {
    const normalized = folder
        .trim()
        .replace(/[^a-zA-Z0-9/_-]/g, '-')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '')
    return normalized || 'products'
}

function parseImageDataUri(imageBase64: string) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(imageBase64)
    if (!match) {
        throw new Error('Invalid image format. Must be base64 data URI')
    }

    const mimeTypeRaw = match[1]
    if (!mimeTypeRaw) {
        throw new Error('Invalid image format. Missing MIME type')
    }

    const mimeType = mimeTypeRaw.toLowerCase()
    const extension = mimeToExtension[mimeType]
    if (!extension) {
        throw new Error(`Unsupported image MIME type: ${mimeType}`)
    }

    const payload = match[2]
    if (!payload) {
        throw new Error('Invalid image format. Missing base64 payload')
    }

    const raw = atob(payload)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i += 1) {
        bytes[i] = raw.charCodeAt(i)
    }

    return { mimeType, extension, bytes }
}

function buildObjectKey(orgId: string, folder: string, extension: string) {
    const randomId = crypto.randomUUID()
    return `beres/${orgId}/${folder}/${randomId}.${extension}`
}

function hasR2Config(env: Bindings) {
    return Boolean(env.R2_UPLOADS && env.R2_PUBLIC_BASE_URL)
}

function hasCloudinaryConfig(env: Bindings) {
    return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_UPLOAD_PRESET)
}

function resolveUploadProvider(env: Bindings): 'r2' | 'cloudinary' {
    const provider = env.UPLOAD_PROVIDER?.trim().toLowerCase()
    if (provider === 'r2') {
        if (!hasR2Config(env)) {
            throw new Error('UPLOAD_PROVIDER is set to r2 but R2_UPLOADS/R2_PUBLIC_BASE_URL is missing')
        }
        return 'r2'
    }

    if (provider === 'cloudinary') {
        if (!hasCloudinaryConfig(env)) {
            throw new Error('UPLOAD_PROVIDER is set to cloudinary but Cloudinary env is missing')
        }
        return 'cloudinary'
    }

    if (hasR2Config(env)) return 'r2'
    if (hasCloudinaryConfig(env)) return 'cloudinary'

    throw new Error('No upload provider is configured')
}

function buildPublicObjectUrl(baseUrl: string, key: string) {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    return new URL(key, normalizedBase).toString()
}

async function uploadToCloudinary(env: Bindings, orgId: string, folder: string, imageBase64: string) {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary env is missing')
    }

    const formData = new FormData()
    formData.append('file', imageBase64)
    formData.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', `beres/${orgId}/${folder}`)

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`
    const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        const error = await response.text()
        console.error('Cloudinary upload error:', error)
        throw new Error('Failed to upload image to cloud storage')
    }

    const result = (await response.json()) as {
        secure_url: string
        public_id: string
        width?: number
        height?: number
        format?: string
        bytes?: number
    }

    return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
    }
}

async function uploadToR2(env: Bindings, orgId: string, folder: string, imageBase64: string) {
    if (!env.R2_UPLOADS || !env.R2_PUBLIC_BASE_URL) {
        throw new Error('R2 env is missing')
    }

    const parsed = parseImageDataUri(imageBase64)
    const objectKey = buildObjectKey(orgId, folder, parsed.extension)

    await env.R2_UPLOADS.put(objectKey, parsed.bytes, {
        httpMetadata: {
            contentType: parsed.mimeType,
        },
        customMetadata: {
            orgId,
            folder,
        },
    })

    return {
        url: buildPublicObjectUrl(env.R2_PUBLIC_BASE_URL, objectKey),
        publicId: objectKey,
        format: parsed.extension,
        bytes: parsed.bytes.byteLength,
    }
}

async function uploadImageWithProvider(
    provider: 'r2' | 'cloudinary',
    env: Bindings,
    orgId: string,
    folder: string,
    imageBase64: string
) {
    const safeFolder = sanitizeFolder(folder)
    if (provider === 'r2') {
        return uploadToR2(env, orgId, safeFolder, imageBase64)
    }
    return uploadToCloudinary(env, orgId, safeFolder, imageBase64)
}

export const uploadRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Upload provider supports:
// - Cloudflare R2 (preferred, when R2 binding + public base URL are configured)
// - Cloudinary unsigned upload (fallback/backward compatibility)

// POST /api/dashboard/upload/image
// Upload single image using configured provider
uploadRouter.post('/image', authMiddleware, async (c) => {
    try {
        const env = c.env
        const orgId = await getOrgId(c)
        const provider = resolveUploadProvider(env)
        const body = await c.req.json().catch(() => null)
        const parsedBody = imageUploadSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { image: imageBase64, folder = 'products' } = parsedBody.data
        const result = await uploadImageWithProvider(provider, env, orgId, folder, imageBase64)
        return ok(c, result)
    } catch (err: any) {
        console.error('[upload/image]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/upload/multiple
// Upload multiple images using configured provider
uploadRouter.post('/multiple', authMiddleware, async (c) => {
    try {
        const env = c.env
        const orgId = await getOrgId(c)
        const provider = resolveUploadProvider(env)
        const body = await c.req.json().catch(() => null)
        const parsedBody = multipleImageUploadSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { images, folder = 'products' } = parsedBody.data
        const uploadPromises = images.map(async (imageBase64) =>
            uploadImageWithProvider(provider, env, orgId, folder, imageBase64)
        )

        const results = await Promise.all(uploadPromises)

        return ok(c, { images: results })
    } catch (err: any) {
        console.error('[upload/multiple]', err)
        return errors.internal(c)
    }
})

// DELETE /api/dashboard/upload/image
// Delete image from storage provider
uploadRouter.delete('/image', authMiddleware, async (c) => {
    try {
        return errors.badRequest(c, 'Image deletion not implemented. Please delete manually from your storage dashboard.')
    } catch (err: any) {
        console.error('[upload/delete]', err)
        return errors.internal(c)
    }
})
