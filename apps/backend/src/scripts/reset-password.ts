import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function resetPassword({ container }: ExecArgs) {
  const args = process.argv
  const emailIndex = args.indexOf("--email")
  const passwordIndex = args.indexOf("--password")

  if (emailIndex === -1 || !args[emailIndex + 1]) {
    console.error("Missing --email argument")
    console.error(
      "Usage: npx medusa exec ./src/scripts/reset-password.ts -- --email admin@example.com --password NewSecret123"
    )
    process.exit(1)
  }

  if (passwordIndex === -1 || !args[passwordIndex + 1]) {
    console.error("Missing --password argument")
    console.error(
      "Usage: npx medusa exec ./src/scripts/reset-password.ts -- --email admin@example.com --password NewSecret123"
    )
    process.exit(1)
  }

  const email = args[emailIndex + 1]
  const password = args[passwordIndex + 1]

  const authModuleService = container.resolve(Modules.AUTH)

  const { success } = await authModuleService.updateProvider("emailpass", {
    entity_id: email,
    password,
  })

  if (!success) {
    console.error(`Failed to reset password for ${email}. User may not exist.`)
    process.exit(1)
  }

  console.log(`Password reset successfully for ${email}`)
}
