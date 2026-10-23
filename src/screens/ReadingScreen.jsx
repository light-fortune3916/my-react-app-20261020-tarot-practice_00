import { useState } from 'react'
import { SUITS } from '../data/cards.js'
import { PAYMENTS_ENABLED } from '../lib/features.js'

function suitLabel(id) {
  return SUITS.find((s) => s.id === id).label
}

function Consultation({ consultation, onRetry }) {
  if (!consultation || consultation.status === 'loading') {
    return <p className="placeholder">相談者が来ました。お話を聞いています…</p>
  }
  if (consultation.status === 'error') {
    return (
      <div className="row">
        <p className="placeholder">
          相談文を作れませんでした。
          {consultation.reason && <span className="error-detail">({consultation.reason})</span>}
        </p>
        <button type="button" className="secondary" onClick={onRetry}>
          もう一度試す
        </button>
      </div>
    )
  }
  const c = consultation.data
  return (
    <>
      <p className="client">
        <strong>{c.name}</strong>({c.profile})
      </p>
      <p className="client-mood">{c.personality}</p>
      <blockquote className="consultation">{c.consultation}</blockquote>
      <p className="client-question">知りたいこと:{c.question}</p>
    </>
  )
}

const MIN_ANSWER = 20

export default function ReadingScreen({
  question,
  consultation,
  onRetryConsultation,
  attempt,
  onAttemptChange,
  scoring,
  limitReached,
  onSubmit,
  onBack,
  onRedraw,
}) {
  const [showHint, setShowHint] = useState(false)
  const { theme, cards, fallback } = question
  const { answer } = attempt
  const length = answer.trim().length
  const ready = consultation?.status === 'ready'
  const busy = scoring.status === 'loading'

  function toggleHint() {
    if (!showHint) onAttemptChange({ ...attempt, hintUsed: true })
    setShowHint((v) => !v)
  }

  return (
    <div className="screen">
      <button type="button" className="link" onClick={onBack}>
        ← 設定に戻る
      </button>

      <section className="panel">
        <h2>相談内容</h2>
        <p className="theme-tag">
          {theme.category} / {theme.sub}
        </p>
        <Consultation consultation={consultation} onRetry={onRetryConsultation} />
      </section>

      {fallback && (
        <p className="notice">
          選んだカードでは指定の難易度に合う組み合わせがなかったため、難易度を問わずに引きました。
        </p>
      )}

      <section className="cards">
        {cards.map((d) => (
          <div key={d.position} className="card">
            <div className="position">{d.position}</div>
            <div className={d.reversed ? 'face reversed' : 'face'}>
              <span className="suit">{suitLabel(d.card.suit)}</span>
              <span className="name">{d.card.name}</span>
            </div>
            <div className="orientation">{d.reversed ? '逆位置' : '正位置'}</div>
            {showHint && (
              <div className="hint">{d.reversed ? d.card.reversed : d.card.upright}</div>
            )}
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>あなたの鑑定</h2>
        <textarea
          value={answer}
          onChange={(e) => onAttemptChange({ ...attempt, answer: e.target.value })}
          maxLength={2000}
          disabled={busy}
          placeholder="相談者に語りかけるつもりで書いてみましょう"
          rows={8}
        />
        <div className="row">
          <button type="button" className="secondary" onClick={toggleHint}>
            {showHint ? 'ヒントを隠す' : 'ヒントを見る(-5点)'}
          </button>
          <button type="button" className="secondary" onClick={onRedraw}>
            別のお題を引く
          </button>
        </div>
        <p className="counter-text">
          {length}文字{length < MIN_ANSWER && `(あと${MIN_ANSWER - length}文字以上)`}
        </p>
        {limitReached ? (
          <p className="notice">
            今日の採点回数を使い切りました。日本時間の0時に回数が戻ります。
            {PAYMENTS_ENABLED && '有料会員(月額500円)なら回数無制限で練習できます。'}
          </p>
        ) : (
          scoring.status === 'error' && <p className="notice">採点できませんでした。({scoring.reason})</p>
        )}
        <button
          type="button"
          className="primary"
          onClick={onSubmit}
          disabled={!ready || busy || limitReached || length < MIN_ANSWER}
        >
          {busy ? '採点中…' : '採点する'}
        </button>
      </section>
    </div>
  )
}
