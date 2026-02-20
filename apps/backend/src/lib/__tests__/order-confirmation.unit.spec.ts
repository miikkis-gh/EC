import { orderConfirmationEmail } from "../templates/order-confirmation"

describe("orderConfirmationEmail", () => {
  const baseOrder = {
    display_id: "1234",
    email: "test@example.com",
    items: [
      { title: "T-Shirt", quantity: 2, unit_price: 2500 },
      { title: "Jeans", quantity: 1, unit_price: 5000 },
    ],
    total: 10000,
    shipping_address: { first_name: "John" } as { first_name: string } | null,
    currency_code: "usd",
  }

  it("renders HTML with order data", () => {
    const html = orderConfirmationEmail(baseOrder)

    expect(html).toContain("1234")
    expect(html).toContain("T-Shirt")
    expect(html).toContain("Jeans")
    expect(html).toContain("Order Confirmed")
  })

  it("escapes HTML in customer name and item titles", () => {
    const order = {
      ...baseOrder,
      shipping_address: { first_name: '<script>alert("xss")</script>' },
      items: [{ title: '<img onerror="hack()">', quantity: 1, unit_price: 1000 }],
    }

    const html = orderConfirmationEmail(order)

    expect(html).not.toContain("<script>")
    expect(html).not.toContain('<img onerror')
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&lt;img onerror=&quot;hack()&quot;&gt;")
  })

  it("formats prices correctly", () => {
    const html = orderConfirmationEmail(baseOrder)

    // total: 10000 cents = $100.00
    expect(html).toContain("$100.00")
    // T-Shirt: 2500 * 2 = 5000 cents = $50.00
    expect(html).toContain("$50.00")
  })

  it("handles null shipping address", () => {
    const order = { ...baseOrder, shipping_address: null }
    const html = orderConfirmationEmail(order)

    expect(html).toContain("Hi there")
  })

  it("handles empty items array", () => {
    const order = { ...baseOrder, items: [] }
    const html = orderConfirmationEmail(order)

    expect(html).toContain("1234")
    expect(html).toContain("Order Confirmed")
  })

  it("uses env vars for store URL and name", () => {
    const originalUrl = process.env.PUBLIC_STORE_URL
    const originalName = process.env.STORE_NAME

    process.env.PUBLIC_STORE_URL = "https://mystore.com"
    process.env.STORE_NAME = "My Store"

    try {
      const html = orderConfirmationEmail(baseOrder)

      expect(html).toContain("https://mystore.com/account")
      expect(html).toContain("My Store")
    } finally {
      if (originalUrl !== undefined) process.env.PUBLIC_STORE_URL = originalUrl
      else delete process.env.PUBLIC_STORE_URL
      if (originalName !== undefined) process.env.STORE_NAME = originalName
      else delete process.env.STORE_NAME
    }
  })
})
