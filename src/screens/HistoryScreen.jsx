import { useEffect, useState } from 'react'
import { fetchHistory } from '../lib/supabase.js'
import AccountPanel from '../components/AccountPanel.jsx'

function formatDate(iso) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 履歴の閲覧はメール登録した人の特典(登録なしの間の練習も保存はしておき、登録すると見られる)
export default function HistoryScreen({ user, onOpen, onBack, onSignedOut }) {
  // state: { status: 'loading' | 'ready' | 'error', items, reason }
  const [state, setState] = useState({ status: 'loading', items: [] })
  const locked = !user || user.isAnonymous

  useEffect(() => {
    if (locked) return
    let active = true
    fetchHistory()
      .then((items) => active && setState({ status: 'ready', items }))
      .catch((err) => active && setState({ status: 'error', items: [], reason: err.message }))
    return () => {
      active = false
    }
  }, [locked])

  if (locked) {
    return (
      <div className="screen">
        <button type="button" className="link" onClick={onBack}>
          ← 戻る
        </button>
        <h1 className="title">練習の履歴</h1>
        <p className="placeholder">
          履歴はメールアドレスを登録すると見られます。登録前に練習した分もそのまま引き継がれます。
        </p>
        <AccountPanel user={user} onSignedOut={onSignedOut} />
      </div>
    )
  }

  return (
    <div className="screen">
      <button type="button" className="link" onClick={onBack}>
        ← 戻る
      </button>
      <h1 className="title">練習の履歴</h1>

      {state.status === 'loading' && <p className="placeholder">読み込み中…</p>}
      {state.status === 'error' && <p className="notice">履歴を読み込めませんでした。({state.reason})</p>}
      {state.status === 'ready' && state.items.length === 0 && (
        <p className="placeholder">まだ練習の記録がありません。お題を引いて鑑定してみましょう。</p>
      )}

      {state.items.map((item) => (
        <button key={item.id} type="button" className="panel history-item" onClick={() => onOpen(item)}>
          <span className="history-score">{item.total}点</span>
          <span className="history-body">
            <span className="history-theme">
              {item.category} / {item.sub}
            </span>
            <span className="history-cards">
              {item.cards.map((c) => `${c.card.name}${c.reversed ? '(逆)' : ''}`).join(' ・ ')}
            </span>
          </span>
          <span className="history-date">{formatDate(item.created_at)}</span>
        </button>
      ))}
    </div>
  )
}
