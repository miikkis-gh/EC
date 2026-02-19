import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.EMAIL_FROM || "EC1 Store <noreply@yourdomain.com>",
}: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  })

  if (error) {
    console.error("[email] Send error:", error)
    throw error
  }

  return data
}
