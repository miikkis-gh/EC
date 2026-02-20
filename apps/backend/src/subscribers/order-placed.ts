import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail } from "../lib/email"
import { orderConfirmationEmail } from "../lib/templates/order-confirmation"

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
      console.warn(`[order-placed] Order ${orderId} has no email, skipping`)
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
        console.log(`[order-placed] Confirmation email sent to ${order.email}`)
        return
      } catch (error) {
        lastError = error
        if (attempt < MAX_RETRIES) {
          console.warn(`[order-placed] Email attempt ${attempt + 1} failed for order ${orderId}, retrying...`)
          await delay(RETRY_DELAY_MS * (attempt + 1))
        }
      }
    }

    console.error(`[order-placed] Failed to send email for order ${orderId} after ${MAX_RETRIES + 1} attempts:`, lastError)
  } catch (error) {
    console.error(`[order-placed] Failed to process order ${orderId}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
