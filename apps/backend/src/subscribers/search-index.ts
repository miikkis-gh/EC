import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import client, { PRODUCTS_INDEX, productToDocument } from "../lib/meilisearch"

export default async function searchIndexHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const productId = data.id
  const index = client.index(PRODUCTS_INDEX)

  if (name === "product.deleted") {
    try {
      await index.deleteDocument(productId)
    } catch (error) {
      console.error(`[search-index] Failed to delete product ${productId}:`, error)
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
    console.error(`[search-index] Failed to index product ${productId}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
