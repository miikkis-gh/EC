jest.mock("../../lib/email", () => ({
  sendEmail: jest.fn(),
}))

jest.mock("../../lib/templates/order-confirmation", () => ({
  orderConfirmationEmail: jest.fn(),
}))

jest.mock("../../lib/logger", () => {
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  return { createLogger: jest.fn(() => log), _mockLog: log }
})

import orderPlacedHandler from "../order-placed"
import { sendEmail } from "../../lib/email"
import { orderConfirmationEmail } from "../../lib/templates/order-confirmation"

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>
const mockOrderConfirmation = orderConfirmationEmail as jest.MockedFunction<typeof orderConfirmationEmail>
const { _mockLog: mockLog } = jest.requireMock<any>("../../lib/logger")

function makeArgs(order: Record<string, unknown>) {
  const mockOrderService = {
    retrieveOrder: jest.fn().mockResolvedValue(order),
  }
  return {
    event: { data: { id: "order_123" } },
    container: {
      resolve: jest.fn((name: string) => {
        if (name === "order") return mockOrderService
        throw new Error(`Unknown service: ${name}`)
      }),
    },
    mockOrderService,
  }
}

const fullOrder = {
  email: "customer@example.com",
  display_id: 42,
  items: [{ title: "Widget", quantity: 1, unit_price: 1000 }],
  total: 1000,
  shipping_address: { first_name: "Alice" },
  currency_code: "usd",
}

describe("orderPlacedHandler", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockSendEmail.mockResolvedValue({ id: "email_123" } as any)
    mockOrderConfirmation.mockReturnValue("<html>test</html>")
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("sends email on successful order retrieval", async () => {
    const { event, container } = makeArgs(fullOrder)

    await orderPlacedHandler({ event, container } as any)

    expect(mockOrderConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        display_id: "42",
        email: "customer@example.com",
      })
    )
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "customer@example.com",
      subject: "Order #42 confirmed",
      html: "<html>test</html>",
    })
  })

  it("skips sending when order has no email", async () => {
    const { event, container } = makeArgs({ ...fullOrder, email: null })

    await orderPlacedHandler({ event, container } as any)

    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Order has no email, skipping",
      expect.objectContaining({ orderId: "order_123" })
    )
  })

  it("retries up to MAX_RETRIES times on email failure", async () => {
    mockSendEmail.mockRejectedValue(new Error("send failed"))
    const { event, container } = makeArgs(fullOrder)

    const promise = orderPlacedHandler({ event, container } as any)
    await jest.runAllTimersAsync()
    await promise

    // 1 initial + 2 retries = 3 calls
    expect(mockSendEmail).toHaveBeenCalledTimes(3)
  })

  it("logs warning on each retry attempt", async () => {
    mockSendEmail.mockRejectedValue(new Error("send failed"))
    const { event, container } = makeArgs(fullOrder)

    const promise = orderPlacedHandler({ event, container } as any)
    await jest.runAllTimersAsync()
    await promise

    expect(mockLog.warn).toHaveBeenCalledTimes(2)
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Email attempt 1 failed, retrying",
      expect.objectContaining({ orderId: "order_123" })
    )
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Email attempt 2 failed, retrying",
      expect.objectContaining({ orderId: "order_123" })
    )
  })

  it("logs error after all retries exhausted", async () => {
    mockSendEmail.mockRejectedValue(new Error("send failed"))
    const { event, container } = makeArgs(fullOrder)

    const promise = orderPlacedHandler({ event, container } as any)
    await jest.runAllTimersAsync()
    await promise

    expect(mockLog.error).toHaveBeenCalledWith(
      "Failed to send email after 3 attempts",
      expect.any(Error),
      expect.objectContaining({ orderId: "order_123" })
    )
  })

  it("handles order retrieval failure gracefully", async () => {
    const mockOrderService = {
      retrieveOrder: jest.fn().mockRejectedValue(new Error("DB error")),
    }
    const event = { data: { id: "order_123" } }
    const container = {
      resolve: jest.fn(() => mockOrderService),
    }

    await orderPlacedHandler({ event, container } as any)

    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(mockLog.error).toHaveBeenCalledWith(
      "Failed to process order",
      expect.any(Error),
      expect.objectContaining({ orderId: "order_123" })
    )
  })

  it("passes correct email subject with display_id", async () => {
    const { event, container } = makeArgs({ ...fullOrder, display_id: 99 })

    await orderPlacedHandler({ event, container } as any)

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Order #99 confirmed" })
    )
  })
})
