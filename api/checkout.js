import { admin, getUser } from './_lib/supabase.js'
import { appUrl, stripe } from './_lib/stripe.js'

// 月額プランの購入画面(Stripe Checkout)を作り、そのURLを返す
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST のみ対応しています' })
    return
  }
  try {
    const user = await getUser(req)
    if (!user) {
      res.status(401).json({ error: 'ログイン情報を確認できませんでした。ページを再読み込みしてください' })
      return
    }
    // 登録なしのまま購入すると、ブラウザのデータが消えたときに会員情報も失われるため
    if (user.is_anonymous || !user.email) {
      res.status(400).json({ error: '購入の前に、メールアドレスの登録をお願いします' })
      return
    }
    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) throw new Error('STRIPE_PRICE_ID が設定されていません')

    const { data: profile, error } = await admin()
      .from('profiles')
      .select('is_premium, stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw error
    if (profile?.is_premium) {
      res.status(400).json({ error: 'すでに有料会員です' })
      return
    }

    // Stripe 側の顧客を用意(2回目以降は同じ顧客を使う)
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe().customers.create({ email: user.email, metadata: { user_id: user.id } })
      customerId = customer.id
      const { error: saveError } = await admin()
        .from('profiles')
        .upsert({ id: user.id, stripe_customer_id: customerId }, { onConflict: 'id' })
      if (saveError) throw saveError
    }

    const base = appUrl(req)
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${base}/?checkout=success`,
      cancel_url: `${base}/?checkout=cancel`,
      locale: 'ja',
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '購入画面を開けませんでした', reason: String(err.message).slice(0, 200) })
  }
}
