function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export function shippingNotificationEmail(order: {
  display_id: string
  first_name: string
  items: { title: string; quantity: number; unit_price: number }[]
  currency_code: string
  tracking_number?: string | null
  tracking_url?: string | null
  carrier?: string | null
}) {
  const name = escapeHtml(order.first_name || "there")
  const displayId = escapeHtml(String(order.display_id))

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          ${escapeHtml(item.title)}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
          ${formatPrice(item.unit_price * item.quantity, order.currency_code)}
        </td>
      </tr>`
    )
    .join("")

  const trackingNumber = order.tracking_number
    ? escapeHtml(order.tracking_number)
    : null
  const carrier = order.carrier ? escapeHtml(order.carrier) : null
  const trackingUrl = order.tracking_url
    ? encodeURI(order.tracking_url)
    : null

  const trackingSection = trackingNumber
    ? `
      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
          ${carrier ? `Carrier: <strong>${carrier}</strong> &bull; ` : ""}Tracking Number:
        </p>
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1a1a2e;">
          ${trackingNumber}
        </p>
        ${
          trackingUrl
            ? `
          <a href="${trackingUrl}"
             style="display: inline-block; margin-top: 12px; background: #1a1a2e; color: white; padding: 10px 24px; border-radius: 50px; text-decoration: none; font-weight: 500; font-size: 14px;">
            Track Your Order
          </a>`
            : ""
        }
      </div>`
    : ""

  const storeUrl = encodeURI(process.env.PUBLIC_STORE_URL || "http://localhost:5173")
  const storeName = escapeHtml(process.env.STORE_NAME || "EC1 Store")

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <h1 style="margin: 0 0 8px; font-size: 24px; color: #1a1a2e;">
            Your Order Has Shipped
          </h1>
          <p style="color: #6b7280; margin: 0 0 24px;">
            Hi ${name}, great news! Your order #${displayId} is on its way.
          </p>

          ${trackingSection}

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #1a1a2e; font-size: 14px;">Item</th>
                <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #1a1a2e; font-size: 14px;">Qty</th>
                <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #1a1a2e; font-size: 14px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <a href="${storeUrl}/account/orders"
             style="display: block; text-align: center; background: #1a1a2e; color: white; padding: 14px; border-radius: 50px; text-decoration: none; margin-top: 32px; font-weight: 500;">
            View Your Orders
          </a>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          ${storeName}
        </p>
      </div>
    </body>
    </html>
  `
}
