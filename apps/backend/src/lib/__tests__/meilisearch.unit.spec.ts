import { productToDocument, PRODUCTS_INDEX } from "../meilisearch"

describe("meilisearch", () => {
  describe("PRODUCTS_INDEX", () => {
    it("equals 'products'", () => {
      expect(PRODUCTS_INDEX).toBe("products")
    })
  })

  describe("productToDocument", () => {
    it("transforms a full product correctly", () => {
      const product = {
        id: "prod_123",
        title: "Test Product",
        handle: "test-product",
        description: "A test product",
        thumbnail: "https://example.com/img.jpg",
        status: "published",
        collection: { id: "col_1", title: "Summer", handle: "summer" },
        categories: [{ name: "Clothing" }, { name: "Shirts" }],
        tags: [{ value: "sale" }, { value: "new" }],
        variants: [{ title: "Small" }, { title: "Medium" }],
        created_at: "2024-01-01T00:00:00.000Z",
      }

      const doc = productToDocument(product)

      expect(doc).toEqual({
        id: "prod_123",
        title: "Test Product",
        handle: "test-product",
        description: "A test product",
        thumbnail: "https://example.com/img.jpg",
        status: "published",
        collection_id: "col_1",
        collection_title: "Summer",
        collection_handle: "summer",
        categories: ["Clothing", "Shirts"],
        tags: ["sale", "new"],
        variant_titles: ["Small", "Medium"],
        created_at: "2024-01-01T00:00:00.000Z",
      })
    })

    it("handles null/missing fields with defaults", () => {
      const doc = productToDocument({ id: "prod_min" })

      expect(doc.title).toBe("")
      expect(doc.handle).toBe("")
      expect(doc.description).toBe("")
      expect(doc.thumbnail).toBeNull()
      expect(doc.status).toBe("draft")
      expect(doc.collection_id).toBeNull()
      expect(doc.collection_title).toBeNull()
      expect(doc.collection_handle).toBeNull()
    })

    it("converts Date objects to ISO strings", () => {
      const date = new Date("2024-06-15T12:00:00.000Z")
      const doc = productToDocument({ id: "prod_date", created_at: date })

      expect(doc.created_at).toBe("2024-06-15T12:00:00.000Z")
    })

    it("maps categories/tags/variants to string arrays", () => {
      const doc = productToDocument({
        id: "prod_arrays",
        categories: [{ name: "A" }, { name: "B" }],
        tags: [{ value: "x" }],
        variants: [{ title: "V1" }, { title: "V2" }, { title: "V3" }],
      })

      expect(doc.categories).toEqual(["A", "B"])
      expect(doc.tags).toEqual(["x"])
      expect(doc.variant_titles).toEqual(["V1", "V2", "V3"])
    })

    it("handles empty arrays", () => {
      const doc = productToDocument({
        id: "prod_empty",
        categories: [],
        tags: [],
        variants: [],
      })

      expect(doc.categories).toEqual([])
      expect(doc.tags).toEqual([])
      expect(doc.variant_titles).toEqual([])
    })

    it("handles null arrays as empty", () => {
      const doc = productToDocument({
        id: "prod_null",
        categories: null,
        tags: null,
        variants: null,
      })

      expect(doc.categories).toEqual([])
      expect(doc.tags).toEqual([])
      expect(doc.variant_titles).toEqual([])
    })
  })
})
