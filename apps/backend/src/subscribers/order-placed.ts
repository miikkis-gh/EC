import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail } from "../lib/email"
import { orderConfirmationEmail } from "../lib/templates/order-confirmation"
import { createLogger } from "../lib/logger"

const log = createLogger("order-placed")

interface OrderItem {
  title: string
  quantity: number
  unit_price: number
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id

  try {
    const orderService = container.resolve("order")
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address"],
    })

    if (!order.email) {
      log.warn("Order has no email, skipping", { orderId })
      return
    }

    const displayId = String(order.display_id ?? orderId)

    const html = orderConfirmationEmail({
      display_id: displayId,
      email: order.email,
      items: (order.items ?? []).map((item: OrderItem) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      total: Number(order.total),
      shipping_address: order.shipping_address
        ? { first_name: order.shipping_address.first_name ?? "Customer" }
        : null,
      currency_code: order.currency_code,
    })

    let lastError: unknown
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await sendEmail({
          to: order.email,
          subject: `Order #${displayId} confirmed`,
          html,
        })
        log.info("Confirmation email sent", { orderId, email: order.email })
        return
      } catch (error) {
        lastError = error
        if (attempt < MAX_RETRIES) {
          log.warn(`Email attempt ${attempt + 1} failed, retrying`, { orderId })
          await delay(RETRY_DELAY_MS * (attempt + 1))
        }
      }
    }

    log.error(`Failed to send email after ${MAX_RETRIES + 1} attempts`, lastError, { orderId })
  } catch (error) {
    log.error("Failed to process order", error, { orderId })
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
