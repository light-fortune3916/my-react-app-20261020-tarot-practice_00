// サーバー関数(/api/...)の呼び出し

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    // 400 は入力の問題なのでメッセージをそのまま、500 は原因を表示
    throw new Error(res.status === 400 ? data.error : data.reason || data.error || `status ${res.status}`)
  }
  return res.json()
}

export function fetchConsultation(theme) {
  return post('/api/question', { category: theme.category, sub: theme.sub })
}

export function scoreReading({ consultation, cards, answer, hintUsed }) {
  return post('/api/score', {
    consultation,
    cards: cards.map((d) => ({ id: d.card.id, reversed: d.reversed })),
    answer,
    hintUsed,
  })
}
