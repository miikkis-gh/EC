import { MeiliSearch } from "meilisearch"

export const PRODUCTS_INDEX = "products"

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY || "",
})

export default client

export async function ensureProductsIndex() {
  try {
    await client.getIndex(PRODUCTS_INDEX)
  } catch {
    await client.createIndex(PRODUCTS_INDEX, { primaryKey: "id" })
  }

  const index = client.index(PRODUCTS_INDEX)

  await index.updateSearchableAttributes([
    "title",
    "description",
    "handle",
    "collection_title",
    "categories",
    "tags",
    "variant_titles",
  ])

  await index.updateFilterableAttributes([
    "collection_id",
    "collection_handle",
    "status",
    "categories",
  ])

  await index.updateSortableAttributes(["created_at", "title"])

  await index.updateRankingRules([
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
  ])
}

export interface ProductDocument {
  id: string
  title: string
  handle: string
  description: string
  thumbnail: string | null
  status: string
  collection_id: string | null
  collection_title: string | null
  collection_handle: string | null
  categories: string[]
  tags: string[]
  variant_titles: string[]
  created_at: string
}

export function productToDocument(product: any): ProductDocument {
  return {
    id: product.id,
    title: product.title || "",
    handle: product.handle || "",
    description: product.description || "",
    thumbnail: product.thumbnail || null,
    status: product.status || "draft",
    collection_id: product.collection?.id || null,
    collection_title: product.collection?.title || null,
    collection_handle: product.collection?.handle || null,
    categories: (product.categories || []).map((c: any) => c.name),
    tags: (product.tags || []).map((t: any) => t.value),
    variant_titles: (product.variants || []).map((v: any) => v.title),
    created_at: product.created_at || new Date().toISOString(),
  }
}
