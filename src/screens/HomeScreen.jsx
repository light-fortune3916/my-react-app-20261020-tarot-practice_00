import { SUITS } from '../data/cards.js'
import { CATEGORIES, DIFFICULTIES } from '../data/themes.js'
import { PRESETS } from '../lib/settings.js'
import AccountPanel from '../components/AccountPanel.jsx'
import PlanPanel from '../components/PlanPanel.jsx'

export default function HomeScreen({
  settings,
  onChange,
  onDraw,
  quota,
  user,
  onSignedOut,
  onHistory,
  checkoutResult,
}) {
  const { suits, allowReversed, difficulty, theme } = settings
  const category = CATEGORIES.find((c) => c.id === theme.categoryId)

  function toggleSuit(id) {
    const next = suits.includes(id) ? suits.filter((s) => s !== id) : [...suits, id]
    if (next.length === 0) return // 最低1つは必須
    onChange({ ...settings, suits: next })
  }

  function applyPreset(p) {
    onChange({ ...settings, suits: p.suits, allowReversed: p.allowReversed })
  }

  function setTheme(next) {
    onChange({ ...settings, theme: { ...theme, ...next } })
  }

  const cardCount = SUITS.filter((s) => suits.includes(s.id)).reduce((n, s) => n + s.count, 0)

  return (
    <div className="screen">
      <h1 className="title">タロット鑑定練習</h1>

      <button type="button" className="primary big" onClick={onDraw}>
        お題を引く
      </button>
      <div className="home-meta">
        <span>
          {quota && !quota.premium && `今日の残り採点回数:${quota.remaining} / ${quota.limit}回`}
          {quota?.premium && '有料会員(回数無制限)'}
        </span>
        <button type="button" className="link" onClick={onHistory}>
          練習の履歴 →
        </button>
      </div>

      <AccountPanel user={user} onSignedOut={onSignedOut} />
      <PlanPanel user={user} quota={quota} checkoutResult={checkoutResult} />

      <section className="panel">
        <h2>テーマ</h2>
        <div className="chips">
          <button
            type="button"
            className={theme.mode === 'random' ? 'chip on' : 'chip'}
            onClick={() => setTheme({ mode: 'random', categoryId: null, sub: null })}
          >
            ランダム
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={theme.mode === 'category' && theme.categoryId === c.id ? 'chip on' : 'chip'}
              onClick={() => setTheme({ mode: 'category', categoryId: c.id, sub: null })}
            >
              {c.label}
            </button>
          ))}
        </div>
        {theme.mode === 'category' && category && (
          <div className="chips sub">
            <button
              type="button"
              className={theme.sub === null ? 'chip on' : 'chip'}
              onClick={() => setTheme({ sub: null })}
            >
              おまかせ
            </button>
            {category.subs.map((s) => (
              <button
                key={s}
                type="button"
                className={theme.sub === s ? 'chip on' : 'chip'}
                onClick={() => setTheme({ sub: s })}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>難易度</h2>
        <div className="chips">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              type="button"
              className={difficulty === d.id ? 'chip on' : 'chip'}
              onClick={() => onChange({ ...settings, difficulty: d.id })}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>使用するカード({cardCount}枚)</h2>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="chip preset" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="chips">
          {SUITS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={suits.includes(s.id) ? 'chip on' : 'chip'}
              onClick={() => toggleSuit(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={allowReversed}
            onChange={(e) => onChange({ ...settings, allowReversed: e.target.checked })}
          />
          逆位置を出す
        </label>
      </section>
    </div>
  )
}
