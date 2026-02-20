jest.mock("../../lib/meilisearch", () => {
  const addDocuments = jest.fn()
  const deleteDocument = jest.fn()
  const productToDocument = jest.fn()
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue({
      index: jest.fn(() => ({ addDocuments, deleteDocument })),
    }),
    PRODUCTS_INDEX: "products",
    productToDocument,
    _mockAddDocuments: addDocuments,
    _mockDeleteDocument: deleteDocument,
    _mockProductToDocument: productToDocument,
  }
})

jest.mock("../../lib/logger", () => {
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  return { createLogger: jest.fn(() => log), _mockLog: log }
})

import searchIndexHandler from "../search-index"

const {
  _mockAddDocuments: mockAddDocuments,
  _mockDeleteDocument: mockDeleteDocument,
  _mockProductToDocument: mockProductToDocument,
} = jest.requireMock<any>("../../lib/meilisearch")
const { _mockLog: mockLog } = jest.requireMock<any>("../../lib/logger")

function makeArgs(eventName: string, productId: string, product?: Record<string, unknown>) {
  const mockProductService = {
    retrieveProduct: jest.fn().mockResolvedValue(product || { id: productId, title: "Test" }),
  }
  return {
    event: { name: eventName, data: { id: productId } },
    container: {
      resolve: jest.fn((name: string) => {
        if (name === "product") return mockProductService
        throw new Error(`Unknown service: ${name}`)
      }),
    },
    mockProductService,
  }
}

describe("searchIndexHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddDocuments.mockResolvedValue({})
    mockDeleteDocument.mockResolvedValue({})
    mockProductToDocument.mockImplementation((p: any) => ({ id: p.id, title: p.title }))
  })

  it("indexes product on product.created event", async () => {
    const { event, container, mockProductService } = makeArgs(
      "product.created", "prod_1", { id: "prod_1", title: "New Product" }
    )

    await searchIndexHandler({ event, container } as any)

    expect(mockProductService.retrieveProduct).toHaveBeenCalledWith("prod_1", {
      relations: ["variants", "collection", "categories", "tags"],
    })
    expect(mockProductToDocument).toHaveBeenCalledWith({ id: "prod_1", title: "New Product" })
    expect(mockAddDocuments).toHaveBeenCalledWith([{ id: "prod_1", title: "New Product" }])
  })

  it("indexes product on product.updated event", async () => {
    const { event, container } = makeArgs(
      "product.updated", "prod_2", { id: "prod_2", title: "Updated" }
    )

    await searchIndexHandler({ event, container } as any)

    expect(mockAddDocuments).toHaveBeenCalledTimes(1)
  })

  it("deletes document on product.deleted event", async () => {
    const { event, container } = makeArgs("product.deleted", "prod_3")

    await searchIndexHandler({ event, container } as any)

    expect(mockDeleteDocument).toHaveBeenCalledWith("prod_3")
    expect(mockAddDocuments).not.toHaveBeenCalled()
  })

  it("logs error on index failure without throwing", async () => {
    mockAddDocuments.mockRejectedValue(new Error("index failed"))
    const { event, container } = makeArgs("product.created", "prod_4")

    await expect(
      searchIndexHandler({ event, container } as any)
    ).resolves.toBeUndefined()

    expect(mockLog.error).toHaveBeenCalledWith(
      "Failed to index product",
      expect.any(Error),
      expect.objectContaining({ productId: "prod_4" })
    )
  })

  it("logs error on delete failure without throwing", async () => {
    mockDeleteDocument.mockRejectedValue(new Error("delete failed"))
    const { event, container } = makeArgs("product.deleted", "prod_5")

    await expect(
      searchIndexHandler({ event, container } as any)
    ).resolves.toBeUndefined()

    expect(mockLog.error).toHaveBeenCalledWith(
      "Failed to delete product from index",
      expect.any(Error),
      expect.objectContaining({ productId: "prod_5" })
    )
  })

  it("calls productToDocument with retrieved product data", async () => {
    const product = { id: "prod_6", title: "Fancy Hat", handle: "fancy-hat" }
    const { event, container } = makeArgs("product.updated", "prod_6", product)

    await searchIndexHandler({ event, container } as any)

    expect(mockProductToDocument).toHaveBeenCalledWith(product)
  })
})
