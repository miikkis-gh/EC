export const PRODUCTS_INDEX = "products"

interface MeiliSearchClient {
  getIndex(uid: string): Promise<unknown>
  createIndex(uid: string, options: { primaryKey: string }): Promise<unknown>
  index(uid: string): {
    addDocuments(documents: ProductDocument[]): Promise<unknown>
    deleteDocument(id: string): Promise<unknown>
    updateSearchableAttributes(attrs: string[]): Promise<unknown>
    updateFilterableAttributes(attrs: string[]): Promise<unknown>
    updateSortableAttributes(attrs: string[]): Promise<unknown>
    updateRankingRules(rules: string[]): Promise<unknown>
  }
}

let _client: MeiliSearchClient | null = null

async function getClient(): Promise<MeiliSearchClient> {
  if (!_client) {
    const { MeiliSearch } = await import("meilisearch")
    _client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
      apiKey: process.env.MEILISEARCH_API_KEY || "",
    }) as MeiliSearchClient
  }
  return _client
}

export default getClient

export async function ensureProductsIndex() {
  const client = await getClient()
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

interface ProductInput {
  id: string
  title?: string | null
  handle?: string | null
  description?: string | null
  thumbnail?: string | null
  status?: string | null
  collection?: { id: string; title: string; handle: string } | null
  categories?: { name: string }[] | null
  tags?: { value: string }[] | null
  variants?: { title: string }[] | null
  created_at?: string | Date | null
}

export function productToDocument(product: ProductInput): ProductDocument {
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
    categories: (product.categories || []).map((c) => c.name),
    tags: (product.tags || []).map((t) => t.value),
    variant_titles: (product.variants || []).map((v) => v.title),
    created_at: product.created_at instanceof Date ? product.created_at.toISOString() : (product.created_at || new Date().toISOString()),
  }
}
