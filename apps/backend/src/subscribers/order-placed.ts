import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail } from "../lib/email"
import { orderConfirmationEmail } from "../lib/templates/order-confirmation"

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
      items: (order.items ?? []).map((item: any) => ({
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

    await sendEmail({
      to: order.email,
      subject: `Order #${displayId} confirmed`,
      html,
    })

    console.log(`[order-placed] Confirmation email sent to ${order.email}`)
  } catch (error) {
    console.error(`[order-placed] Failed to send email for order ${orderId}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
