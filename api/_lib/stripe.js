import Stripe from 'stripe'

// Stripe(課金)。サーバー側専用
// Vercel の環境変数:
//   STRIPE_SECRET_KEY      … シークレットキー(sk_test_ / sk_live_)
//   STRIPE_PRICE_ID        … 月額プランの価格ID(price_...)
//   STRIPE_WEBHOOK_SECRET  … 決済通知(Webhook)の署名シークレット(whsec_...)

let client = null

export function stripe() {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY が設定されていません')
  client = new Stripe(key)
  return client
}

// 決済画面から戻ってくる先(このアプリのURL)
export function appUrl(req) {
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  return `${proto}://${host}`
}

// 有料会員として扱うサブスクリプションの状態
export function isActiveStatus(status) {
  return status === 'active' || status === 'trialing'
}
