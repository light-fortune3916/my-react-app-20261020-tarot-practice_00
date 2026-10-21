import { admin } from './_lib/supabase.js'

// Supabase の無料プランは、1週間アクセスがないと一時停止する。
// Vercel の定期実行(vercel.json の crons)から週1回呼び出して、データベースに軽くアクセスする。
export default async function handler(req, res) {
  // CRON_SECRET を設定している場合は、Vercel の定期実行からの呼び出しだけを受け付ける
  const secret = process.env.CRON_SECRET
  if (secret && req.headers?.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  try {
    const { error } = await admin().from('profiles').select('id', { head: true, count: 'exact' }).limit(1)
    if (error) throw error
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false })
  }
}
