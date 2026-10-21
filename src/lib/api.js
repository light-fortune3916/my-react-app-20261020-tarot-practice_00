// サーバー関数(/api/...)の呼び出し

export async function fetchConsultation(theme) {
  const res = await fetch('/api/question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category: theme.category, sub: theme.sub }),
  })
  if (!res.ok) throw new Error(`status ${res.status}`)
  return res.json()
}
