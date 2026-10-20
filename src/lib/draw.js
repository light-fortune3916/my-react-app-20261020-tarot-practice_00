import { CARDS } from '../data/cards.js'
import { CATEGORIES, POSITIONS } from '../data/themes.js'

// お題の抽選はすべてここで行う(AIには引かせない)

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function toneOf(drawn) {
  return drawn.reversed ? drawn.card.rtone : drawn.card.tone
}

// 上級 = 明るいカードと重いカードがぶつかる組み合わせ
export function isConflict(drawnCards) {
  const tones = drawnCards.map(toneOf)
  return tones.includes('L') && tones.includes('H')
}

function matches(drawnCards, difficulty) {
  if (difficulty === 'hard') return isConflict(drawnCards)
  if (difficulty === 'easy') return !isConflict(drawnCards)
  return true
}

// 選ばれたカードの中から、難易度に合う2枚の組み合わせを返す。
// 合う組み合わせがなければ、条件なしで引いて fallback: true を返す。
export function drawCards({ suits, allowReversed, difficulty }) {
  const pool = CARDS.filter((c) => suits.includes(c.suit))
  if (pool.length < POSITIONS.length) throw new Error('カードが足りません')

  const orientations = allowReversed ? [false, true] : [false]
  const candidates = []
  for (const a of pool) {
    for (const b of pool) {
      if (a.id === b.id) continue
      for (const ra of orientations) {
        for (const rb of orientations) {
          candidates.push([
            { card: a, reversed: ra },
            { card: b, reversed: rb },
          ])
        }
      }
    }
  }

  const ok = candidates.filter((c) => matches(c, difficulty))
  const chosen = ok.length > 0 ? pick(ok) : pick(candidates)
  return {
    cards: chosen.map((d, i) => ({ ...d, position: POSITIONS[i] })),
    fallback: ok.length === 0,
  }
}

// theme: { mode: 'random' } | { mode: 'category', categoryId, sub: string|null }
export function drawTheme(theme) {
  const category =
    theme.mode === 'category'
      ? CATEGORIES.find((c) => c.id === theme.categoryId)
      : pick(CATEGORIES)
  const sub = theme.mode === 'category' && theme.sub ? theme.sub : pick(category.subs)
  return { category: category.label, sub }
}

export function drawQuestion(settings) {
  const { cards, fallback } = drawCards(settings)
  return { theme: drawTheme(settings.theme), cards, fallback }
}
