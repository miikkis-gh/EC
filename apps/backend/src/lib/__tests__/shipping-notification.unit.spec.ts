import { shippingNotificationEmail } from "../templates/shipping-notification"

describe("shippingNotificationEmail", () => {
  const baseOrder = {
    display_id: "1234",
    first_name: "Alice",
    items: [
      { title: "T-Shirt", quantity: 2, unit_price: 2500 },
      { title: "Jeans", quantity: 1, unit_price: 5000 },
    ],
    currency_code: "usd",
    tracking_number: "1Z999AA10123456784",
    tracking_url: "https://track.example.com/1Z999AA10123456784",
    carrier: "UPS",
  }

  it("renders HTML with order data", () => {
    const html = shippingNotificationEmail(baseOrder)

    expect(html).toContain("1234")
    expect(html).toContain("T-Shirt")
    expect(html).toContain("Jeans")
    expect(html).toContain("Your Order Has Shipped")
    expect(html).toContain("Hi Alice")
  })

  it("includes tracking info when provided", () => {
    const html = shippingNotificationEmail(baseOrder)

    expect(html).toContain("1Z999AA10123456784")
    expect(html).toContain("https://track.example.com/1Z999AA10123456784")
    expect(html).toContain("UPS")
    expect(html).toContain("Track Your Order")
  })

  it("omits tracking section when no tracking number", () => {
    const order = {
      ...baseOrder,
      tracking_number: null,
      tracking_url: null,
      carrier: null,
    }

    const html = shippingNotificationEmail(order)

    expect(html).not.toContain("Track Your Order")
    expect(html).not.toContain("Tracking Number")
    expect(html).toContain("Your Order Has Shipped")
  })

  it("escapes HTML in customer name and item titles", () => {
    const order = {
      ...baseOrder,
      first_name: '<script>alert("xss")</script>',
      items: [{ title: '<img onerror="hack()">', quantity: 1, unit_price: 1000 }],
    }

    const html = shippingNotificationEmail(order)

    expect(html).not.toContain("<script>")
    expect(html).not.toContain('<img onerror')
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&lt;img onerror=&quot;hack()&quot;&gt;")
  })

  it("formats prices correctly", () => {
    const html = shippingNotificationEmail(baseOrder)

    // T-Shirt: 2500 * 2 = 5000 cents = $50.00
    expect(html).toContain("$50.00")
  })

  it("handles empty first_name", () => {
    const order = { ...baseOrder, first_name: "" }
    const html = shippingNotificationEmail(order)

    expect(html).toContain("Hi there")
  })

  it("handles tracking number without URL", () => {
    const order = {
      ...baseOrder,
      tracking_url: null,
    }

    const html = shippingNotificationEmail(order)

    expect(html).toContain("1Z999AA10123456784")
    expect(html).not.toContain("Track Your Order")
  })

  it("uses env vars for store URL and name", () => {
    const originalUrl = process.env.PUBLIC_STORE_URL
    const originalName = process.env.STORE_NAME

    process.env.PUBLIC_STORE_URL = "https://mystore.com"
    process.env.STORE_NAME = "My Store"

    try {
      const html = shippingNotificationEmail(baseOrder)

      expect(html).toContain("https://mystore.com/account/orders")
      expect(html).toContain("My Store")
    } finally {
      if (originalUrl !== undefined) process.env.PUBLIC_STORE_URL = originalUrl
      else delete process.env.PUBLIC_STORE_URL
      if (originalName !== undefined) process.env.STORE_NAME = originalName
      else delete process.env.STORE_NAME
    }
  })
})
