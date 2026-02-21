import sharp from "sharp"
import { encode } from "blurhash"
import * as fs from "fs/promises"
import * as path from "path"
import { createLogger } from "./logger"

const log = createLogger("image-processor")

const VARIANT_WIDTHS = [320, 640, 960, 1280, 1600]
const BLURHASH_SIZE = 32
const WEBP_QUALITY = 80

export interface ProcessedImage {
  original: string
  variants: { width: number; path: string }[]
  blurhash: string
  width: number
  height: number
}

function getUploadsDir(): string {
  return path.resolve(process.cwd(), "uploads")
}

export async function processProductImage(
  inputBuffer: Buffer,
  productId: string,
  imageIndex: number
): Promise<ProcessedImage> {
  const outputDir = path.join(getUploadsDir(), "products", productId)
  await fs.mkdir(outputDir, { recursive: true })

  const metadata = await sharp(inputBuffer).metadata()
  const originalWidth = metadata.width ?? 1600
  const originalHeight = metadata.height ?? 1600

  // Save original as WebP
  const originalFilename = `image-${imageIndex}.webp`
  const originalPath = path.join(outputDir, originalFilename)
  await sharp(inputBuffer)
    .webp({ quality: WEBP_QUALITY })
    .toFile(originalPath)

  // Generate width variants
  const variants: { width: number; path: string }[] = []
  for (const width of VARIANT_WIDTHS) {
    if (width >= originalWidth) continue

    const variantFilename = `image-${imageIndex}-${width}w.webp`
    const variantPath = path.join(outputDir, variantFilename)

    await sharp(inputBuffer)
      .resize(width)
      .webp({ quality: WEBP_QUALITY })
      .toFile(variantPath)

    variants.push({
      width,
      path: `/uploads/products/${productId}/${variantFilename}`,
    })
  }

  // Generate blurhash
  const { data, info } = await sharp(inputBuffer)
    .resize(BLURHASH_SIZE, BLURHASH_SIZE, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4,
    3
  )

  log.info("Image processed", {
    productId,
    imageIndex,
    originalWidth,
    variants: variants.length,
  })

  return {
    original: `/uploads/products/${productId}/${originalFilename}`,
    variants,
    blurhash,
    width: originalWidth,
    height: originalHeight,
  }
}

export async function processProductImageFromUrl(
  imageUrl: string,
  productId: string,
  imageIndex: number
): Promise<ProcessedImage | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      log.warn("Failed to fetch image", { imageUrl, status: response.status })
      return null
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return await processProductImage(buffer, productId, imageIndex)
  } catch (error) {
    log.error("Failed to process image from URL", error, { imageUrl, productId })
    return null
  }
}
