import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import getClient, { PRODUCTS_INDEX, productToDocument } from "../lib/meilisearch"
import { createLogger } from "../lib/logger"

const log = createLogger("search-index")

export default async function searchIndexHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id
  const client = await getClient()
  const index = client.index(PRODUCTS_INDEX)

  if (name === "product.deleted") {
    try {
      await index.deleteDocument(productId)
    } catch (error) {
      log.error("Failed to delete product from index", error, { productId })
    }
    return
  }

  // product.created or product.updated — index the product
  try {
    const productService = container.resolve("product")
    const product = await productService.retrieveProduct(productId, {
      relations: ["variants", "collection", "categories", "tags"],
    })

    const document = productToDocument(product)
    await index.addDocuments([document])
  } catch (error) {
    log.error("Failed to index product", error, { productId })
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
