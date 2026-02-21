import type { ExecArgs } from "@medusajs/framework/types"
import { processProductImageFromUrl } from "../lib/image-processor"
import { createLogger } from "../lib/logger"

const log = createLogger("process-existing-images")

export default async function processExistingImages({ container }: ExecArgs) {
  const productService = container.resolve("product")

  log.info("Starting batch image processing")

  const [products] = await productService.listAndCountProducts(
    {},
    { take: 500, relations: ["images"] }
  )

  let processed = 0
  let skipped = 0

  for (const product of products) {
    if (!product.images?.length) {
      skipped++
      continue
    }

    const existingProcessed: string[] =
      (product.metadata?.processed_image_urls as string[]) ?? []

    const unprocessed = product.images.filter(
      (img: { url: string }) => img.url && !existingProcessed.includes(img.url)
    )

    if (unprocessed.length === 0) {
      skipped++
      continue
    }

    const blurhashes: Record<string, string> =
      (product.metadata?.image_blurhashes as Record<string, string>) ?? {}

    for (let i = 0; i < product.images.length; i++) {
      const image = product.images[i]
      if (!image.url || existingProcessed.includes(image.url)) continue

      const result = await processProductImageFromUrl(image.url, product.id, i)
      if (result) {
        blurhashes[image.url] = result.blurhash
      }
    }

    const allUrls = product.images.map((img: { url: string }) => img.url)
    await productService.updateProducts([
      {
        id: product.id,
        metadata: {
          ...product.metadata,
          image_blurhashes: blurhashes,
          processed_image_urls: allUrls,
        },
      },
    ])

    processed++
    log.info(`Processed ${product.id}`, { title: product.title, images: product.images.length })
  }

  log.info("Batch processing complete", { processed, skipped, total: products.length })
}
