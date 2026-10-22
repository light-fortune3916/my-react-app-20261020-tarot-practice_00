import { admin } from './_lib/supabase.js'
import { isActiveStatus, stripe } from './_lib/stripe.js'

// Stripe からの決済通知(Webhook)を受け取り、有料会員かどうかを更新する。
// 署名の確認には「加工前の本文」が必要なので、本文を自分で読み込む。
export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

async function updateBySubscription(subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
  const userId = subscription.metadata?.user_id
  const fields = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    is_premium: isActiveStatus(subscription.status),
  }
  if (userId) {
    const { error } = await admin().from('profiles').upsert({ id: userId, ...fields }, { onConflict: 'id' })
    if (error) throw error
  } else {
    const { error } = await admin().from('profiles').update(fields).eq('stripe_customer_id', customerId)
    if (error) throw error
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET が設定されていません')
    res.status(500).end()
    return
  }

  let event
  try {
    const raw = await readRawBody(req)
    event = stripe().webhooks.constructEvent(raw, req.headers['stripe-signature'], secret)
  } catch (err) {
    console.error('Webhook の署名を確認できませんでした', err.message)
    res.status(400).send('invalid signature')
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe().subscriptions.retrieve(session.subscription)
          await updateBySubscription(subscription)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await updateBySubscription(event.data.object)
        break
      default:
        break
    }
    res.status(200).json({ received: true })
  } catch (err) {
    // 500 を返すと Stripe が時間をおいて再送してくれる
    console.error(err)
    res.status(500).json({ error: 'webhook handling failed' })
  }
}
