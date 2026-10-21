import { createClient } from '@supabase/supabase-js'

// サーバー側専用の Supabase 接続(service_role キーを使うので、ブラウザには絶対に出さない)
// Vercel の環境変数:
//   VITE_SUPABASE_URL          … 画面側と共通
//   SUPABASE_SERVICE_ROLE_KEY  … サーバー専用の秘密キー

export const LIMITS = {
  free: { score: 3, question: 10 },
  // 有料会員も、API代の暴走を防ぐために上限は持たせる
  premium: { score: 100, question: 200 },
}

let client = null

export function admin() {
  if (client) return client
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase の環境変数が設定されていません')
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

// リクエストのログイン情報(匿名ログインを含む)からユーザーを確認する
export async function getUser(req) {
  const header = req.headers?.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  const { data, error } = await admin().auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

// 日本時間の今日0時(UTC表記)
export function startOfTodayJst(now = Date.now()) {
  const jst = new Date(now + 9 * 3600 * 1000)
  jst.setUTCHours(0, 0, 0, 0)
  return new Date(jst.getTime() - 9 * 3600 * 1000).toISOString()
}

export async function limitsFor(userId) {
  const { data, error } = await admin().from('profiles').select('is_premium').eq('id', userId).maybeSingle()
  if (error) throw error
  return data?.is_premium ? LIMITS.premium : LIMITS.free
}

export async function countToday(userId, kind) {
  const { count, error } = await admin()
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', kind)
    .gte('created_at', startOfTodayJst())
  if (error) throw error
  return count ?? 0
}

export async function recordUsage(userId, kind) {
  const { error } = await admin().from('usage_events').insert({ user_id: userId, kind })
  if (error) throw error
}

// ログイン確認と回数チェックをまとめて行う。
// 問題があればレスポンスを返して null、問題なければ { user, used, limit } を返す
export async function checkQuota(req, res, kind) {
  const user = await getUser(req)
  if (!user) {
    res.status(401).json({ error: 'ログイン情報を確認できませんでした。ページを再読み込みしてください' })
    return null
  }
  const limits = await limitsFor(user.id)
  const used = await countToday(user.id, kind)
  if (used >= limits[kind]) {
    res.status(429).json({
      error:
        kind === 'score'
          ? `今日の採点回数(${limits.score}回)を使い切りました。また明日お試しください`
          : '今日はお題を引ける回数の上限に達しました。また明日お試しください',
      limitReached: true,
    })
    return null
  }
  return { user, used, limit: limits[kind] }
}
