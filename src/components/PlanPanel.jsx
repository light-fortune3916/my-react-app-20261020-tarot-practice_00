import { useState } from 'react'
import { openBillingPortal, startCheckout } from '../lib/api.js'

// ホーム画面の料金プラン欄
export default function PlanPanel({ user, quota, checkoutResult }) {
  // status: { state: 'idle' | 'loading' | 'error', message }
  const [status, setStatus] = useState({ state: 'idle' })

  if (!user || !quota) return null

  async function run(action) {
    setStatus({ state: 'loading' })
    try {
      await action()
    } catch (err) {
      setStatus({ state: 'error', message: err.message })
    }
  }

  const busy = status.state === 'loading'

  return (
    <section className="panel plan">
      {checkoutResult === 'success' && !quota.premium && (
        <p className="notice">ご購入ありがとうございます。会員情報を反映しています。少し待って再読み込みしてください。</p>
      )}
      {checkoutResult === 'success' && quota.premium && (
        <p className="notice success">ご購入ありがとうございます!回数無制限で練習できます。</p>
      )}

      {quota.premium ? (
        <div className="account-row">
          <span>
            <strong>有料会員</strong>(月額500円)
          </span>
          <button type="button" className="link" disabled={busy} onClick={() => run(openBillingPortal)}>
            お支払い・解約の管理
          </button>
        </div>
      ) : (
        <>
          <div className="account-row">
            <span>
              <strong>月額500円</strong>で採点の回数が無制限に
            </span>
            <button
              type="button"
              className="secondary small"
              disabled={busy || user.isAnonymous}
              onClick={() => run(startCheckout)}
            >
              {busy ? '移動中…' : '有料会員になる'}
            </button>
          </div>
          {user.isAnonymous && <p className="account-note">購入の前に、上の「メールで登録」をお願いします。</p>}
        </>
      )}

      {status.state === 'error' && <p className="notice">{status.message}</p>}
    </section>
  )
}
