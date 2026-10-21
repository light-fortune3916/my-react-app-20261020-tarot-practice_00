const AXES = [
  { key: 'card', label: 'カード理解' },
  { key: 'story', label: 'ストーリー性' },
  { key: 'empathy', label: '寄り添い' },
  { key: 'delivery', label: '伝え方' },
]

function rankOf(total) {
  if (total >= 90) return 'プロ級!'
  if (total >= 75) return '一人前'
  if (total >= 60) return '見習い'
  if (total >= 40) return '駆け出し'
  return '修行中'
}

export default function ResultScreen({ question, result, answer, previousTotal, onRetry, onNext, onHome }) {
  const { scores, total, penalty, good, improve, cardFeedback, modelReading } = result
  const diff = previousTotal === null ? null : total - previousTotal

  return (
    <div className="screen">
      <section className="panel score-panel">
        <div className="total">
          <span className="total-number">{total}</span>
          <span className="total-max">/ 100点</span>
        </div>
        <div className="rank">{rankOf(total)}</div>
        {diff !== null && (
          <div className={diff >= 0 ? 'diff up' : 'diff down'}>
            前回から {diff >= 0 ? `+${diff}` : diff}点
          </div>
        )}
        {penalty > 0 && <div className="penalty">ヒント使用 -{penalty}点</div>}
      </section>

      <section className="panel">
        <h2>観点ごとの評価</h2>
        {AXES.map((a) => (
          <div key={a.key} className="bar-row">
            <span className="bar-label">{a.label}</span>
            <span className="bar">
              <span className="bar-fill" style={{ width: `${(scores[a.key] / 25) * 100}%` }} />
            </span>
            <span className="bar-value">{scores[a.key]}/25</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>良かった点</h2>
        <p className="body-text">{good}</p>
        <h2>改善のアドバイス</h2>
        <p className="body-text">{improve}</p>
      </section>

      {cardFeedback.length > 0 && (
        <section className="panel">
          <h2>カードごとの講評</h2>
          {question.cards.map((d) => {
            const fb = cardFeedback.find((f) => f.position === d.position)
            if (!fb) return null
            return (
              <div key={d.position} className="card-feedback">
                <div className="card-feedback-title">
                  <span className={fb.understood ? 'mark ok' : 'mark ng'}>{fb.understood ? '◯' : '△'}</span>
                  {d.position}:{d.card.name}({d.reversed ? '逆位置' : '正位置'})
                </div>
                <p className="body-text">{fb.comment}</p>
              </div>
            )
          })}
        </section>
      )}

      <details className="panel">
        <summary>模範鑑定を見る</summary>
        <p className="body-text">{modelReading}</p>
      </details>

      <details className="panel">
        <summary>あなたの鑑定</summary>
        <p className="body-text">{answer}</p>
      </details>

      <div className="actions">
        <button type="button" className="primary" onClick={onNext}>
          次のお題へ
        </button>
        <button type="button" className="secondary" onClick={onRetry}>
          同じお題でもう一度
        </button>
        <button type="button" className="link center" onClick={onHome}>
          設定に戻る
        </button>
      </div>
    </div>
  )
}
