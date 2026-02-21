jest.mock("../../lib/email", () => ({
  sendEmail: jest.fn(),
}))

jest.mock("../../lib/templates/shipping-notification", () => ({
  shippingNotificationEmail: jest.fn(),
}))

jest.mock("../../lib/logger", () => {
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  return { createLogger: jest.fn(() => log), _mockLog: log }
})

import fulfillmentCreatedHandler from "../fulfillment-created"
import { sendEmail } from "../../lib/email"
import { shippingNotificationEmail } from "../../lib/templates/shipping-notification"

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>
const mockShippingNotification = shippingNotificationEmail as jest.MockedFunction<typeof shippingNotificationEmail>
const { _mockLog: mockLog } = jest.requireMock<any>("../../lib/logger")

const fullOrder = {
  email: "customer@example.com",
  display_id: 42,
  items: [{ title: "Widget", quantity: 1, unit_price: 1000 }],
  total: 1000,
  shipping_address: { first_name: "Alice" },
  currency_code: "usd",
}

const fullFulfillment = {
  order_id: "order_123",
  tracking_links: [
    {
      tracking_number: "1Z999",
      url: "https://track.example.com/1Z999",
      metadata: { carrier: "UPS" },
    },
  ],
}

function makeArgs(fulfillment: Record<string, unknown>, order: Record<string, unknown>) {
  const mockFulfillmentService = {
    retrieveFulfillment: jest.fn().mockResolvedValue(fulfillment),
  }
  const mockOrderService = {
    retrieveOrder: jest.fn().mockResolvedValue(order),
  }
  return {
    event: { data: { id: "ful_123" } },
    container: {
      resolve: jest.fn((name: string) => {
        if (name === "fulfillment") return mockFulfillmentService
        if (name === "order") return mockOrderService
        throw new Error(`Unknown service: ${name}`)
      }),
    },
    mockFulfillmentService,
    mockOrderService,
  }
}

describe("fulfillmentCreatedHandler", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockSendEmail.mockResolvedValue({ id: "email_123" } as any)
    mockShippingNotification.mockReturnValue("<html>shipping</html>")
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("sends shipping email on successful fulfillment", async () => {
    const { event, container } = makeArgs(fullFulfillment, fullOrder)

    await fulfillmentCreatedHandler({ event, container } as any)

    expect(mockShippingNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        display_id: "42",
        first_name: "Alice",
        tracking_number: "1Z999",
        tracking_url: "https://track.example.com/1Z999",
        carrier: "UPS",
      })
    )
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "customer@example.com",
      subject: "Order #42 has shipped",
      html: "<html>shipping</html>",
    })
  })

  it("skips when fulfillment has no order_id", async () => {
    const { event, container } = makeArgs({ ...fullFulfillment, order_id: null }, fullOrder)

    await fulfillmentCreatedHandler({ event, container } as any)

    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Fulfillment has no order_id, skipping",
      expect.objectContaining({ fulfillmentId: "ful_123" })
    )
  })

  it("skips when order has no email", async () => {
    const { event, container } = makeArgs(fullFulfillment, { ...fullOrder, email: null })

    await fulfillmentCreatedHandler({ event, container } as any)

    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Order has no email, skipping",
      expect.objectContaining({ fulfillmentId: "ful_123" })
    )
  })

  it("retries up to MAX_RETRIES times on email failure", async () => {
    mockSendEmail.mockRejectedValue(new Error("send failed"))
    const { event, container } = makeArgs(fullFulfillment, fullOrder)

    const promise = fulfillmentCreatedHandler({ event, container } as any)
    await jest.runAllTimersAsync()
    await promise

    // 1 initial + 2 retries = 3 calls
    expect(mockSendEmail).toHaveBeenCalledTimes(3)
  })

  it("logs warning on each retry attempt", async () => {
    mockSendEmail.mockRejectedValue(new Error("send failed"))
    const { event, container } = makeArgs(fullFulfillment, fullOrder)

    const promise = fulfillmentCreatedHandler({ event, container } as any)
    await jest.runAllTimersAsync()
    await promise

    expect(mockLog.warn).toHaveBeenCalledTimes(2)
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Email attempt 1 failed, retrying",
      expect.objectContaining({ fulfillmentId: "ful_123" })
    )
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Email attempt 2 failed, retrying",
      expect.objectContaining({ fulfillmentId: "ful_123" })
    )
  })

  it("logs error after all retries exhausted", async () => {
    mockSendEmail.mockRejectedValue(new Error("send failed"))
    const { event, container } = makeArgs(fullFulfillment, fullOrder)

    const promise = fulfillmentCreatedHandler({ event, container } as any)
    await jest.runAllTimersAsync()
    await promise

    expect(mockLog.error).toHaveBeenCalledWith(
      "Failed to send email after 3 attempts",
      expect.any(Error),
      expect.objectContaining({ fulfillmentId: "ful_123" })
    )
  })

  it("handles fulfillment retrieval failure gracefully", async () => {
    const mockFulfillmentService = {
      retrieveFulfillment: jest.fn().mockRejectedValue(new Error("DB error")),
    }
    const event = { data: { id: "ful_123" } }
    const container = {
      resolve: jest.fn((name: string) => {
        if (name === "fulfillment") return mockFulfillmentService
        throw new Error(`Unknown service: ${name}`)
      }),
    }

    await fulfillmentCreatedHandler({ event, container } as any)

    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockLog.error).toHaveBeenCalledWith(
      "Failed to process fulfillment",
      expect.any(Error),
      expect.objectContaining({ fulfillmentId: "ful_123" })
    )
  })

  it("handles fulfillment without tracking links", async () => {
    const fulfillment = { ...fullFulfillment, tracking_links: [] }
    const { event, container } = makeArgs(fulfillment, fullOrder)

    await fulfillmentCreatedHandler({ event, container } as any)

    expect(mockShippingNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        tracking_number: null,
        tracking_url: null,
        carrier: null,
      })
    )
    expect(mockSendEmail).toHaveBeenCalled()
  })
})
