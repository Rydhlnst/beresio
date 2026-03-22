import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'

type Bindings = { 
    DATABASE_URL: string
    BETTER_AUTH_SECRET: string
    BETTER_AUTH_URL: string
    CLOUDINARY_CLOUD_NAME: string
    CLOUDINARY_API_KEY: string
    CLOUDINARY_UPLOAD_PRESET: string
}
type Variables = { db: any; user: any; session: any }

export const uploadRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Cloudinary upload using unsigned upload
// The upload preset must be configured in Cloudinary Dashboard with 'Unsigned' option enabled

// POST /api/dashboard/upload/image
// Upload image to Cloudinary using unsigned upload
uploadRouter.post('/image', authMiddleware, async (c) => {
    try {
        const env = c.env
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const imageBase64 = body?.image
        const folder = body?.folder || 'products'
        
        if (!imageBase64) {
            return errors.badRequest(c, 'Image data is required')
        }

        // Validate base64 format
        if (!imageBase64.startsWith('data:image/')) {
            return errors.badRequest(c, 'Invalid image format. Must be base64 data URI')
        }

        // Prepare form data for Cloudinary
        const formData = new FormData()
        formData.append('file', imageBase64)
        formData.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET)
        formData.append('folder', `beres/${orgId}/${folder}`)

        // Upload to Cloudinary
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`
        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Cloudinary upload error:', error)
            return errors.internal(c, 'Failed to upload image to cloud storage')
        }

        const result = await response.json()

        return ok(c, {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
        })
    } catch (err: any) {
        console.error('[upload/image]', err)
        return errors.internal(c, err.message || 'Failed to upload image')
    }
})

// POST /api/dashboard/upload/multiple
// Upload multiple images
uploadRouter.post('/multiple', authMiddleware, async (c) => {
    try {
        const env = c.env
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const images: string[] = body?.images || []
        const folder = body?.folder || 'products'

        if (!images.length || images.length > 5) {
            return errors.badRequest(c, 'Upload 1-5 images at a time')
        }

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`

        const uploadPromises = images.map(async (imageBase64, index) => {
            if (!imageBase64.startsWith('data:image/')) {
                throw new Error(`Invalid image format at index ${index}`)
            }

            const formData = new FormData()
            formData.append('file', imageBase64)
            formData.append('upload_preset', env.CLOUDINARY_UPLOAD_PRESET)
            formData.append('folder', `beres/${orgId}/${folder}`)

            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error(`Failed to upload image at index ${index}`)
            }

            const result = await response.json()

            return {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
            }
        })

        const results = await Promise.all(uploadPromises)

        return ok(c, { images: results })
    } catch (err: any) {
        console.error('[upload/multiple]', err)
        return errors.internal(c, err.message || 'Failed to upload images')
    }
})

// DELETE /api/dashboard/upload/image
// Delete image from Cloudinary (requires API secret for signed request)
uploadRouter.delete('/image', authMiddleware, async (c) => {
    try {
        // Note: Deleting images requires signed request with API secret
        // For security, this should be done from backend or using signed signatures
        // For now, return info that image should be deleted manually or via admin
        return errors.badRequest(c, 'Image deletion not implemented. Please delete manually from Cloudinary dashboard.')
    } catch (err: any) {
        console.error('[upload/delete]', err)
        return errors.internal(c, err.message || 'Failed to delete image')
    }
})
