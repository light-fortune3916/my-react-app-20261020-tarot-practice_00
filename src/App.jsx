import { useState } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import ReadingScreen from './screens/ReadingScreen.jsx'
import { drawQuestion } from './lib/draw.js'
import { loadSettings, saveSettings } from './lib/settings.js'
import './App.css'

// 画面: home(設定とお題を引く)/ reading(鑑定)
// 採点結果・履歴の画面は後のステップで追加する
export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [screen, setScreen] = useState('home')
  const [question, setQuestion] = useState(null)
  const [drawCount, setDrawCount] = useState(0)

  function updateSettings(next) {
    setSettings(next)
    saveSettings(next)
  }

  function draw() {
    setQuestion(drawQuestion(settings))
    setDrawCount((n) => n + 1)
    setScreen('reading')
  }

  if (screen === 'reading' && question) {
    return (
      <ReadingScreen
        key={drawCount}
        question={question}
        onBack={() => setScreen('home')}
        onRedraw={draw}
      />
    )
  }

  return <HomeScreen settings={settings} onChange={updateSettings} onDraw={draw} />
}
