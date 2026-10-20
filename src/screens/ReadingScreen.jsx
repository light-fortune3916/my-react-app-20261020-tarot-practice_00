import { useState } from 'react'
import { SUITS } from '../data/cards.js'

function suitLabel(id) {
  return SUITS.find((s) => s.id === id).label
}

export default function ReadingScreen({ question, onBack, onRedraw }) {
  const [answer, setAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const { theme, cards, fallback } = question

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
        {/* ステップ3で Gemini が相談者プロフィールと悩みを生成する */}
        <p className="placeholder">
          (仮)「{theme.sub}」についての相談です。相談文は次のステップでAIが自動生成します。
        </p>
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
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="相談者に語りかけるつもりで書いてみましょう"
          rows={8}
        />
        <div className="row">
          <button type="button" className="secondary" onClick={() => setShowHint((v) => !v)}>
            {showHint ? 'ヒントを隠す' : 'ヒントを見る(キーワード)'}
          </button>
          <button type="button" className="secondary" onClick={onRedraw}>
            別のお題を引く
          </button>
        </div>
        {/* ステップ4で採点を実装 */}
        <button type="button" className="primary" disabled>
          採点する(準備中)
        </button>
      </section>
    </div>
  )
}
