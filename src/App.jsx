import { useEffect, useRef, useState } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import ReadingScreen from './screens/ReadingScreen.jsx'
import ResultScreen from './screens/ResultScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import { drawQuestion } from './lib/draw.js'
import { fetchConsultation, scoreReading } from './lib/api.js'
import { loadSettings, saveSettings } from './lib/settings.js'
import { fetchRemaining } from './lib/supabase.js'
import './App.css'

const EMPTY_ATTEMPT = { answer: '', hintUsed: false }

// 画面: home(設定とお題を引く)/ reading(鑑定)/ result(採点結果)
//       history(履歴一覧)/ historyDetail(過去の採点結果)
export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [screen, setScreen] = useState('home')
  const [question, setQuestion] = useState(null)
  // consultation: { status: 'loading' | 'ready' | 'error', data, reason }
  const [consultation, setConsultation] = useState(null)
  const [drawCount, setDrawCount] = useState(0)
  const [attempt, setAttempt] = useState(EMPTY_ATTEMPT)
  // scoring: { status: 'idle' | 'loading' | 'error', reason }
  const [scoring, setScoring] = useState({ status: 'idle' })
  const [result, setResult] = useState(null)
  const [previousTotal, setPreviousTotal] = useState(null)
  const latestDraw = useRef(0)
  // 今日の残り採点回数: { premium, remaining, limit } | null
  const [quota, setQuota] = useState(null)
  const [historyItem, setHistoryItem] = useState(null)

  function refreshQuota() {
    fetchRemaining()
      .then(setQuota)
      .catch(() => setQuota(null))
  }

  // 最初に開いたとき、登録なしの仮ユーザーを用意して残り回数を表示する
  useEffect(() => {
    refreshQuota()
  }, [])

  function updateSettings(next) {
    setSettings(next)
    saveSettings(next)
  }

  async function loadConsultation(theme, drawId) {
    setConsultation({ status: 'loading', data: null })
    try {
      const data = await fetchConsultation(theme)
      // 待っている間に別のお題を引いていたら、古い結果は捨てる
      if (latestDraw.current === drawId) setConsultation({ status: 'ready', data })
    } catch (err) {
      if (latestDraw.current === drawId) setConsultation({ status: 'error', data: null, reason: err.message })
    }
  }

  function draw() {
    const next = drawQuestion(settings)
    const drawId = drawCount + 1
    latestDraw.current = drawId
    setQuestion(next)
    setDrawCount(drawId)
    setAttempt(EMPTY_ATTEMPT)
    setScoring({ status: 'idle' })
    setResult(null)
    setPreviousTotal(null)
    setScreen('reading')
    loadConsultation(next.theme, drawId)
  }

  async function submit() {
    const drawId = drawCount
    setScoring({ status: 'loading' })
    try {
      const data = await scoreReading({
        theme: question.theme,
        consultation: consultation.data,
        cards: question.cards,
        answer: attempt.answer,
        hintUsed: attempt.hintUsed,
      })
      if (latestDraw.current !== drawId) return
      setResult(data)
      if (typeof data.remaining === 'number') setQuota((q) => (q && !q.premium ? { ...q, remaining: data.remaining } : q))
      setScoring({ status: 'idle' })
      setScreen('result')
    } catch (err) {
      if (latestDraw.current === drawId) setScoring({ status: 'error', reason: err.message })
    }
  }

  // 同じお題でもう一度。前回の鑑定文を残して書き直せるようにする
  function retry() {
    setPreviousTotal(result.total)
    setAttempt((a) => ({ ...a, hintUsed: false }))
    setScreen('reading')
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        onOpen={(item) => {
          setHistoryItem(item)
          setScreen('historyDetail')
        }}
        onBack={() => setScreen('home')}
      />
    )
  }

  if (screen === 'historyDetail' && historyItem) {
    return (
      <ResultScreen
        question={{ cards: historyItem.cards }}
        result={{ ...historyItem.feedback, scores: historyItem.scores, total: historyItem.total }}
        answer={historyItem.answer}
        consultation={historyItem.consultation}
        previousTotal={null}
        onHome={() => setScreen('history')}
        homeLabel="履歴一覧に戻る"
      />
    )
  }

  if (screen === 'result' && result) {
    return (
      <ResultScreen
        question={question}
        result={result}
        answer={attempt.answer}
        previousTotal={previousTotal}
        onRetry={retry}
        onNext={draw}
        onHome={() => setScreen('home')}
      />
    )
  }

  if (screen === 'reading' && question) {
    return (
      <ReadingScreen
        key={drawCount}
        question={question}
        consultation={consultation}
        onRetryConsultation={() => loadConsultation(question.theme, drawCount)}
        attempt={attempt}
        onAttemptChange={setAttempt}
        scoring={scoring}
        onSubmit={submit}
        onBack={() => setScreen('home')}
        onRedraw={draw}
      />
    )
  }

  return (
    <HomeScreen
      settings={settings}
      onChange={updateSettings}
      onDraw={draw}
      quota={quota}
      onHistory={() => setScreen('history')}
    />
  )
}
