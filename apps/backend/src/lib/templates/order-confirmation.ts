function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export function orderConfirmationEmail(order: {
  display_id: string
  email: string
  items: { title: string; quantity: number; unit_price: number }[]
  total: number
  shipping_address: { first_name: string } | null
  currency_code: string
}) {
  const name = order.shipping_address?.first_name || "there"

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          ${item.title}
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

  const storeUrl = process.env.PUBLIC_STORE_URL || "http://localhost:5173"

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
            Order Confirmed
          </h1>
          <p style="color: #6b7280; margin: 0 0 32px;">
            Hi ${name}, thanks for your order #${order.display_id}!
          </p>

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
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 16px 0; text-align: right; font-weight: bold;">Total</td>
                <td style="padding: 16px 0; text-align: right; font-weight: bold; font-size: 18px;">
                  ${formatPrice(order.total, order.currency_code)}
                </td>
              </tr>
            </tfoot>
          </table>

          <a href="${storeUrl}/account"
             style="display: block; text-align: center; background: #1a1a2e; color: white; padding: 14px; border-radius: 50px; text-decoration: none; margin-top: 32px; font-weight: 500;">
            View Account
          </a>
        </div>

        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
          EC1 Store
        </p>
      </div>
    </body>
    </html>
  `
}
