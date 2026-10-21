import { useRef, useState } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import ReadingScreen from './screens/ReadingScreen.jsx'
import { drawQuestion } from './lib/draw.js'
import { fetchConsultation } from './lib/api.js'
import { loadSettings, saveSettings } from './lib/settings.js'
import './App.css'

// 画面: home(設定とお題を引く)/ reading(鑑定)
// 採点結果・履歴の画面は後のステップで追加する
export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [screen, setScreen] = useState('home')
  const [question, setQuestion] = useState(null)
  // consultation: { status: 'loading' | 'ready' | 'error', data }
  const [consultation, setConsultation] = useState(null)
  const [drawCount, setDrawCount] = useState(0)
  const latestDraw = useRef(0)

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
    } catch {
      if (latestDraw.current === drawId) setConsultation({ status: 'error', data: null })
    }
  }

  function draw() {
    const next = drawQuestion(settings)
    const drawId = drawCount + 1
    latestDraw.current = drawId
    setQuestion(next)
    setDrawCount(drawId)
    setScreen('reading')
    loadConsultation(next.theme, drawId)
  }

  if (screen === 'reading' && question) {
    return (
      <ReadingScreen
        key={drawCount}
        question={question}
        consultation={consultation}
        onRetryConsultation={() => loadConsultation(question.theme, drawCount)}
        onBack={() => setScreen('home')}
        onRedraw={draw}
      />
    )
  }

  return <HomeScreen settings={settings} onChange={updateSettings} onDraw={draw} />
}
