import { Resend } from "resend"
import { createLogger } from "./logger"

const log = createLogger("email")

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing required environment variable: RESEND_API_KEY")
}

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
    log.error("Send failed", error, { to, subject })
    throw error
  }

  return data
}
