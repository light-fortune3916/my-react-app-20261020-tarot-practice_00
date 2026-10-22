import { admin, getUser } from './_lib/supabase.js'
import { appUrl, stripe } from './_lib/stripe.js'

// お支払い方法の変更・解約ができる Stripe の管理画面(カスタマーポータル)のURLを返す
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
    const { data: profile, error } = await admin()
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()
    if (error) throw error
    if (!profile?.stripe_customer_id) {
      res.status(400).json({ error: 'お支払いの情報が見つかりませんでした' })
      return
    }
    const session = await stripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: appUrl(req),
      locale: 'ja',
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: '管理画面を開けませんでした', reason: String(err.message).slice(0, 200) })
  }
}
