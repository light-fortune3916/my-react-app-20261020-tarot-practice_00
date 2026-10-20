import { SUITS } from '../data/cards.js'

const KEY = 'tarot-practice-settings'

export const PRESETS = [
  { id: 'beginner', label: '入門(大アルカナのみ・正位置のみ)', suits: ['major'], allowReversed: false },
  { id: 'full', label: '本番(全78枚・逆位置あり)', suits: SUITS.map((s) => s.id), allowReversed: true },
]

export const DEFAULT_SETTINGS = {
  suits: SUITS.map((s) => s.id),
  allowReversed: true,
  difficulty: 'any',
  theme: { mode: 'random', categoryId: null, sub: null },
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw)
    const settings = { ...DEFAULT_SETTINGS, ...saved }
    // 壊れたデータなら初期値に戻す
    if (!Array.isArray(settings.suits) || settings.suits.length === 0) return DEFAULT_SETTINGS
    return settings
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // 保存できなくても動作は続ける
  }
}
