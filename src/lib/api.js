import { ensureSession } from './supabase.js'

// サーバー関数(/api/...)の呼び出し。ログイン情報(匿名を含む)を付けて送る

async function post(path, body) {
  const session = await ensureSession()
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    // 400番台は利用者向けのメッセージをそのまま、500番台は原因を表示
    const err = new Error(res.status < 500 ? data.error : data.reason || data.error || `status ${res.status}`)
    err.limitReached = Boolean(data.limitReached)
    throw err
  }
  return res.json()
}

export function fetchConsultation(theme) {
  return post('/api/question', { category: theme.category, sub: theme.sub })
}

export function scoreReading({ theme, consultation, cards, answer, hintUsed }) {
  return post('/api/score', {
    theme,
    consultation,
    cards: cards.map((d) => ({ id: d.card.id, reversed: d.reversed })),
    answer,
    hintUsed,
  })
}
