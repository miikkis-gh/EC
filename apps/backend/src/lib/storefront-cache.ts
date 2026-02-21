import { createLogger } from "./logger"

const log = createLogger("storefront-cache")

export async function invalidateStorefrontCache(patterns: string[]): Promise<void> {
  const url = process.env.STOREFRONT_INTERNAL_URL
  const secret = process.env.CACHE_SECRET

  if (!url || !secret) {
    return
  }

  try {
    const response = await fetch(`${url}/api/internal/cache-invalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ patterns }),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      log.error("Storefront cache invalidation failed", new Error(`HTTP ${response.status}: ${text}`), { patterns })
    } else {
      log.info("Storefront cache invalidated", { patterns })
    }
  } catch (err) {
    log.error("Storefront cache invalidation request failed", err, { patterns })
  }
}
