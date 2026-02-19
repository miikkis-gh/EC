import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import client, {
  PRODUCTS_INDEX,
  ensureProductsIndex,
  productToDocument,
} from "../lib/meilisearch"

export default async function syncSearch({ container }: ExecArgs) {
  console.log("[sync-search] Starting product sync to Meilisearch...")

  await ensureProductsIndex()
  console.log("[sync-search] Index configured")

  const productService = container.resolve(Modules.PRODUCT)

  const BATCH_SIZE = 100
  let offset = 0
  let total = 0

  while (true) {
    const [products, count] = await productService.listAndCountProducts(
      { status: "published" as any },
      {
        relations: ["variants", "collection", "categories", "tags"],
        take: BATCH_SIZE,
        skip: offset,
      }
    )

    if (products.length === 0) break

    const documents = products.map(productToDocument)
    await client.index(PRODUCTS_INDEX).addDocuments(documents)

    total += products.length
    offset += BATCH_SIZE
    console.log(`[sync-search] Indexed ${total} / ${count} products`)

    if (total >= count) break
  }

  console.log(`[sync-search] Done. Total products indexed: ${total}`)
}
