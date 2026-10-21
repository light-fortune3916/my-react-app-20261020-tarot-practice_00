import { createClient } from '@supabase/supabase-js'
import { CARDS } from '../data/cards.js'

// 画面側の Supabase 接続(公開してよい URL と anon キーだけを使う)
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

const FREE_SCORE_LIMIT = 3

// ログイン済みならその情報を、まだなら登録なしの「仮ユーザー」(匿名ログイン)を作って返す
export async function ensureSession() {
  if (!supabase) throw new Error('Supabase の設定がありません')
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  if (data.session) return data.session
  const { data: created, error: signInError } = await supabase.auth.signInAnonymously()
  if (signInError) throw signInError
  return created.session
}

function startOfTodayJst() {
  const jst = new Date(Date.now() + 9 * 3600 * 1000)
  jst.setUTCHours(0, 0, 0, 0)
  return new Date(jst.getTime() - 9 * 3600 * 1000).toISOString()
}

// 今日あと何回採点できるか
export async function fetchRemaining() {
  const session = await ensureSession()
  const userId = session.user.id
  const [{ data: profile }, { count, error }] = await Promise.all([
    supabase.from('profiles').select('is_premium').eq('id', userId).maybeSingle(),
    supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'score')
      .gte('created_at', startOfTodayJst()),
  ])
  if (error) throw error
  if (profile?.is_premium) return { premium: true, remaining: null, limit: null }
  return { premium: false, remaining: Math.max(0, FREE_SCORE_LIMIT - (count ?? 0)), limit: FREE_SCORE_LIMIT }
}

// 練習の履歴(新しい順)
export async function fetchHistory() {
  await ensureSession()
  const { data, error } = await supabase
    .from('readings')
    .select('id, created_at, category, sub, cards, consultation, answer, scores, total, feedback')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data.map((r) => ({
    ...r,
    // カードIDをカードデータに戻す
    cards: r.cards.map((c) => ({ ...c, card: CARDS.find((x) => x.id === c.id) })).filter((c) => c.card),
  }))
}
