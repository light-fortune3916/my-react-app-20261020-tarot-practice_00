import { CATEGORIES } from '../src/data/themes.js'
import { generateJson } from './_lib/gemini.js'

// お題(相談者と相談内容)を作る。
// カードはブラウザ側でプログラムが引くので、ここでは相談内容だけを作る。
// 実際の鑑定と同じく「相談 → カードを引く」の順なので、カードの情報はAIに渡さない。

const AGES = ['20代', '30代', '40代', '50代', '60代']
const GENDERS = ['女性', '男性']
const MOODS = [
  '不安が強く、背中を押してほしい',
  '半ば答えを決めていて、確認したい',
  '迷っていて、整理してほしい',
  '落ち込んでいて、慰めてほしい',
  '少し疑い深く、はっきりした答えを求めている',
  '前向きだが、焦っている',
]

const SYSTEM = `あなたはタロット鑑定の練習アプリのお題作成係です。
タロット占い師に相談しに来た、架空の相談者と相談内容を作ってください。
- 実在の人物・団体名は使わない
- 相談文は相談者本人の話し言葉(一人称)で、3〜5文
- 具体的な状況(期間・人間関係・きっかけ)を1つ以上含める
- タロットカードの名前や意味には触れない
- 自傷・犯罪など深刻すぎる内容は避ける`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING', description: '仮名(例:Aさん、ミカさん)' },
    profile: { type: 'STRING', description: '年代・性別・立場を短く(例:30代女性・会社員)' },
    personality: { type: 'STRING', description: '今の心の状態や性格を1文で' },
    consultation: { type: 'STRING', description: '相談者本人の話し言葉での相談文' },
    question: { type: 'STRING', description: '占い師に一番聞きたいことを1文で' },
  },
  required: ['name', 'profile', 'personality', 'consultation', 'question'],
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST のみ対応しています' })
    return
  }

  // 一覧にあるテーマ以外は受け付けない(任意の文章をAIに送らせないため)
  const { category: categoryLabel, sub } = req.body ?? {}
  const category = CATEGORIES.find((c) => c.label === categoryLabel)
  if (!category || !category.subs.includes(sub)) {
    res.status(400).json({ error: 'テーマが正しくありません' })
    return
  }

  const prompt = `次の条件で相談者を1人作ってください。
- カテゴリー:${category.label}
- サブテーマ:${sub}
- 年代・性別:${pick(AGES)}${pick(GENDERS)}
- 心の状態:${pick(MOODS)}`

  try {
    const result = await generateJson({ system: SYSTEM, prompt, schema: SCHEMA })
    res.status(200).json(result)
  } catch (err) {
    console.error(err)
    // 原因の切り分け用に短い理由を返す(APIキーそのものは含まれない)
    res.status(500).json({ error: '相談文の作成に失敗しました', reason: String(err.message).slice(0, 200) })
  }
}
