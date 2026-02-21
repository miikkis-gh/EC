import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail } from "../lib/email"
import { shippingNotificationEmail } from "../lib/templates/shipping-notification"
import { createLogger } from "../lib/logger"

const log = createLogger("fulfillment-created")

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function fulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const fulfillmentId = data.id

  try {
    const fulfillmentService = container.resolve("fulfillment")
    const orderService = container.resolve("order")

    const fulfillment = await fulfillmentService.retrieveFulfillment(fulfillmentId, {
      relations: ["tracking_links"],
    })

    if (!fulfillment.order_id) {
      log.warn("Fulfillment has no order_id, skipping", { fulfillmentId })
      return
    }

    const order = await orderService.retrieveOrder(fulfillment.order_id, {
      relations: ["items", "shipping_address"],
    })

    if (!order.email) {
      log.warn("Order has no email, skipping", { fulfillmentId, orderId: fulfillment.order_id })
      return
    }

    const trackingLink = fulfillment.tracking_links?.[0]
    const displayId = String(order.display_id ?? fulfillment.order_id)

    const html = shippingNotificationEmail({
      display_id: displayId,
      first_name: order.shipping_address?.first_name ?? "Customer",
      items: (order.items ?? []).map((item: { title: string; quantity: number; unit_price: number }) => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
      currency_code: order.currency_code,
      tracking_number: trackingLink?.tracking_number ?? null,
      tracking_url: trackingLink?.url ?? null,
      carrier: trackingLink?.metadata?.carrier as string ?? null,
    })

    let lastError: unknown
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await sendEmail({
          to: order.email,
          subject: `Order #${displayId} has shipped`,
          html,
        })
        log.info("Shipping notification sent", { fulfillmentId, orderId: fulfillment.order_id, email: order.email })
        return
      } catch (error) {
        lastError = error
        if (attempt < MAX_RETRIES) {
          log.warn(`Email attempt ${attempt + 1} failed, retrying`, { fulfillmentId })
          await delay(RETRY_DELAY_MS * (attempt + 1))
        }
      }
    }

    log.error(`Failed to send email after ${MAX_RETRIES + 1} attempts`, lastError, { fulfillmentId })
  } catch (error) {
    log.error("Failed to process fulfillment", error, { fulfillmentId })
  }
}

export const config: SubscriberConfig = {
  event: "fulfillment.created",
}
