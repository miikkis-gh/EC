import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { processProductImageFromUrl } from "../lib/image-processor"
import { createLogger } from "../lib/logger"

const log = createLogger("product-image")

export default async function productImageHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id

  try {
    const productService = container.resolve("product")
    const product = await productService.retrieveProduct(productId, {
      relations: ["images"],
    })

    if (!product.images?.length) {
      return
    }

    const existingBlurhashes: Record<string, string> =
      (product.metadata?.image_blurhashes as Record<string, string>) ?? {}
    const existingProcessed: string[] =
      (product.metadata?.processed_image_urls as string[]) ?? []

    let hasChanges = false
    const newBlurhashes = { ...existingBlurhashes }

    for (let i = 0; i < product.images.length; i++) {
      const image = product.images[i]
      if (!image.url || existingProcessed.includes(image.url)) continue

      const result = await processProductImageFromUrl(image.url, productId, i)
      if (result) {
        newBlurhashes[image.url] = result.blurhash
        hasChanges = true
      }
    }

    if (hasChanges) {
      const processedUrls = product.images.map((img: { url: string }) => img.url)
      await productService.updateProducts([
        {
          id: productId,
          metadata: {
            ...product.metadata,
            image_blurhashes: newBlurhashes,
            processed_image_urls: processedUrls,
          },
        },
      ])

      log.info("Product images processed", {
        productId,
        imageCount: product.images.length,
      })
    }
  } catch (error) {
    log.error("Failed to process product images", error, { productId })
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
}
