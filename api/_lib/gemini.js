// Gemini API 呼び出し(サーバー側専用。APIキーはブラウザに出さない)
// Vercel の環境変数:
//   GEMINI_API_KEY  … 必須
//   GEMINI_MODEL    … 任意(未設定なら DEFAULT_MODEL)
const DEFAULT_MODEL = 'gemini-3.8-flash'

export async function generateJson({ system, prompt, schema, temperature = 1 }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY が設定されていません')
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    },
  )

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini API エラー ${res.status}: ${detail.slice(0, 300)}`)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')
  if (!text) throw new Error('Gemini の応答が空でした')
  return JSON.parse(text)
}
