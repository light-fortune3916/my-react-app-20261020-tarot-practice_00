import { useState } from 'react'
import { loginWithEmail, registerEmail, signOut } from '../lib/supabase.js'

// ホーム画面のアカウント欄
// - 登録なしで利用中:メール登録(履歴を引き継ぐ)/ 登録済みの人のログイン
// - 登録済み:メールアドレスの表示とログアウト
export default function AccountPanel({ user, onSignedOut }) {
  const [mode, setMode] = useState(null) // 'register' | 'login' | null
  const [email, setEmail] = useState('')
  // status: { state: 'idle' | 'sending' | 'sent' | 'error', message }
  const [status, setStatus] = useState({ state: 'idle' })

  if (!user) return null

  if (!user.isAnonymous) {
    return (
      <section className="panel account">
        <div className="account-row">
          <span>
            <strong>{user.email}</strong> でログイン中
          </span>
          <button
            type="button"
            className="link"
            onClick={async () => {
              await signOut()
              onSignedOut()
            }}
          >
            ログアウト
          </button>
        </div>
      </section>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setStatus({ state: 'sending' })
    try {
      if (mode === 'register') await registerEmail(email.trim())
      else await loginWithEmail(email.trim())
      setStatus({ state: 'sent' })
    } catch (err) {
      setStatus({ state: 'error', message: err.message })
    }
  }

  return (
    <section className="panel account">
      {mode === null && (
        <div className="account-row">
          <span className="account-note">登録なしで利用中(履歴はこの端末だけに残ります)</span>
          <span className="row">
            <button type="button" className="secondary small" onClick={() => setMode('register')}>
              メールで登録
            </button>
            <button type="button" className="link" onClick={() => setMode('login')}>
              ログイン
            </button>
          </span>
        </div>
      )}

      {mode !== null && status.state !== 'sent' && (
        <form onSubmit={submit} className="account-form">
          <p className="account-note">
            {mode === 'register'
              ? 'メールアドレスを登録すると、別の端末でも履歴を見られます。これまでの履歴も引き継がれます。'
              : '登録済みのメールアドレスを入力してください。ログイン用のリンクを送ります。'}
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mail@example.com"
            autoComplete="email"
          />
          {status.state === 'error' && <p className="notice">送信できませんでした。({status.message})</p>}
          <div className="row">
            <button type="submit" className="primary" disabled={status.state === 'sending'}>
              {status.state === 'sending' ? '送信中…' : mode === 'register' ? '確認メールを送る' : 'ログインリンクを送る'}
            </button>
            <button type="button" className="link" onClick={() => setMode(null)}>
              やめる
            </button>
          </div>
        </form>
      )}

      {status.state === 'sent' && (
        <p className="account-note">
          {email} にメールを送りました。メール内のリンクを押すと
          {mode === 'register' ? '登録が完了します。' : 'ログインできます。'}
          (届かない場合は迷惑メールフォルダもご確認ください)
        </p>
      )}
    </section>
  )
}
