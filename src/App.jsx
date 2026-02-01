import { useState, useEffect } from 'react'

// Initial state
const initialProfile = {
  name: '',
  gender: '',
  goal: '',
  symptoms: [],
  frequency: '',
  reminderTime: '09:00',
  level: 1,
  exp: 0,
  streak: 0,
  totalLogs: 0,
  badges: [],
  subscription: 'basic'
}

const initialRecords = {}

// Level system
const LEVELS = [
  { name: 'Seed', emoji: '🌱', minExp: 0 },
  { name: 'Sprout', emoji: '🌿', minExp: 100 },
  { name: 'Seedling', emoji: '🌾', minExp: 300 },
  { name: 'Sapling', emoji: '🌳', minExp: 600 },
  { name: 'Tree', emoji: '🌲', minExp: 1000 },
  { name: 'Bloom', emoji: '🌸', minExp: 1500 }
]

const BADGES = [
  { id: 'first_log', name: 'First Step', emoji: '🏅', desc: 'Logged first entry' },
  { id: 'week_streak', name: 'Week Warrior', emoji: '🔥', desc: '7 day streak' },
  { id: 'month_streak', name: 'Monthly Master', emoji: '👑', desc: '30 day streak' },
  { id: 'fiber_fan', name: 'Fiber Fan', emoji: '🥦', desc: 'Hit fiber goals 10 times' },
  { id: 'hydration_hero', name: 'Hydration Hero', emoji: '💧', desc: 'Logged water 20 times' }
]

// Helper functions
const getDateKey = (date = new Date()) => date.toISOString().split('T')[0]

const getLevelInfo = (exp) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].minExp) {
      const current = LEVELS[i]
      const next = LEVELS[i + 1]
      const expForNext = next ? next.minExp - exp : 0
      const progress = next
        ? ((exp - current.minExp) / (next.minExp - current.minExp)) * 100
        : 100
      return { ...current, level: i + 1, expForNext, progress, nextLevel: next }
    }
  }
  return { ...LEVELS[0], level: 1, expForNext: 100, progress: 0, nextLevel: LEVELS[1] }
}

const calculateMonthStats = (records, year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let good = 0, okay = 0, bad = 0, total = 0, scoreSum = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const record = records[key]
    if (record) {
      total++
      scoreSum += record.score || 70
      if (record.feeling === 'great' || record.feeling === 'good') good++
      else if (record.feeling === 'okay') okay++
      else bad++
    }
  }

  return {
    good,
    okay,
    bad,
    total,
    monthlyAvg: total > 0 ? Math.round(scoreSum / total) : 0,
    goodPercent: total > 0 ? Math.round((good / total) * 100) : 0,
    okayPercent: total > 0 ? Math.round((okay / total) * 100) : 0,
    badPercent: total > 0 ? Math.round((bad / total) * 100) : 0
  }
}

// Main App Component
function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [profile, setProfile] = useState(initialProfile)
  const [records, setRecords] = useState(initialRecords)
  const [activeTab, setActiveTab] = useState('home')

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gutbuddy')
    if (saved) {
      const data = JSON.parse(saved)
      setProfile(data.profile || initialProfile)
      setRecords(data.records || {})
      setOnboardingComplete(data.onboardingComplete || false)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gutbuddy', JSON.stringify({
      profile,
      records,
      onboardingComplete
    }))
  }, [profile, records, onboardingComplete])

  const addExp = (amount) => {
    setProfile(p => ({ ...p, exp: p.exp + amount, totalLogs: p.totalLogs + 1 }))
  }

  const saveRecord = (date, data) => {
    setRecords(r => ({ ...r, [date]: { ...r[date], ...data } }))
    addExp(10)
  }

  if (!onboardingComplete) {
    return (
      <Onboarding
        step={onboardingStep}
        setStep={setOnboardingStep}
        profile={profile}
        setProfile={setProfile}
        onComplete={() => setOnboardingComplete(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream flex justify-center">
      <div className="w-full max-w-[430px] bg-cream min-h-screen pb-20">
        {activeTab === 'home' && <HomeTab profile={profile} records={records} />}
        {activeTab === 'log' && <LogTab records={records} saveRecord={saveRecord} />}
        {activeTab === 'history' && <HistoryTab records={records} />}
        {activeTab === 'insights' && <InsightsTab records={records} />}
        {activeTab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} />}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  )
}

// Onboarding Component
function Onboarding({ step, setStep, profile, setProfile, onComplete }) {
  const steps = [
    // Welcome
    <div key="welcome" className="text-center">
      <div className="text-8xl mb-6">🌿</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to GutBuddy</h1>
      <p className="text-gray-600 mb-8">Your personal gut health companion</p>
      <button
        onClick={() => setStep(1)}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold text-lg"
      >
        Get Started
      </button>
    </div>,

    // Name
    <div key="name" className="text-center">
      <div className="text-6xl mb-4">👋</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your name?</h2>
      <p className="text-gray-500 mb-6">Let's personalize your experience</p>
      <input
        type="text"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        placeholder="Enter your name"
        className="w-full p-4 rounded-2xl border-2 border-mint bg-white text-center text-lg mb-6"
      />
      <button
        onClick={() => setStep(2)}
        disabled={!profile.name}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
      >
        Continue
      </button>
    </div>,

    // Gender
    <div key="gender" className="text-center">
      <div className="text-6xl mb-4">🧑</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select your gender</h2>
      <div className="space-y-3 mb-6">
        {['Male', 'Female', 'Other'].map(g => (
          <button
            key={g}
            onClick={() => setProfile({ ...profile, gender: g })}
            className={`w-full p-4 rounded-2xl border-2 transition-all ${
              profile.gender === g
                ? 'bg-mint border-gold text-gray-800'
                : 'bg-white border-gray-200'
            }`}
          >
            {g === 'Male' ? '👨 ' : g === 'Female' ? '👩 ' : '🧑 '}{g}
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(3)}
        disabled={!profile.gender}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
      >
        Continue
      </button>
    </div>,

    // Goal
    <div key="goal" className="text-center">
      <div className="text-6xl mb-4">🎯</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your main goal?</h2>
      <p className="text-gray-500 mb-4">Select one to personalize your journey</p>
      <div className="space-y-2 mb-6">
        {[
          { id: 'constipation', label: 'Relieve constipation', emoji: '😣' },
          { id: 'diarrhea', label: 'Manage diarrhea', emoji: '💨' },
          { id: 'regular', label: 'Regular movements', emoji: '✅' },
          { id: 'health', label: 'Overall gut health', emoji: '💚' },
          { id: 'bloating', label: 'Reduce bloating', emoji: '🎈' }
        ].map(g => (
          <button
            key={g.id}
            onClick={() => setProfile({ ...profile, goal: g.id })}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              profile.goal === g.id
                ? 'bg-mint border-gold'
                : 'bg-white border-gray-200'
            }`}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(4)}
        disabled={!profile.goal}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
      >
        Continue
      </button>
    </div>,

    // Symptoms
    <div key="symptoms" className="text-center">
      <div className="text-6xl mb-4">🩺</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Any current symptoms?</h2>
      <p className="text-gray-500 mb-4">Select all that apply</p>
      <div className="space-y-2 mb-6">
        {[
          { id: 'bloating', label: 'Bloating', emoji: '🎈' },
          { id: 'gas', label: 'Gas', emoji: '💨' },
          { id: 'pain', label: 'Pain', emoji: '😖' },
          { id: 'irregular', label: 'Irregular', emoji: '📊' },
          { id: 'none', label: 'None', emoji: '✨' }
        ].map(s => (
          <button
            key={s.id}
            onClick={() => {
              const symptoms = profile.symptoms.includes(s.id)
                ? profile.symptoms.filter(x => x !== s.id)
                : [...profile.symptoms, s.id]
              setProfile({ ...profile, symptoms })
            }}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              profile.symptoms.includes(s.id)
                ? 'bg-mint border-gold'
                : 'bg-white border-gray-200'
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(5)}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold"
      >
        Continue
      </button>
    </div>,

    // Frequency
    <div key="frequency" className="text-center">
      <div className="text-6xl mb-4">📅</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Bowel frequency?</h2>
      <p className="text-gray-500 mb-4">How often do you go?</p>
      <div className="space-y-2 mb-6">
        {[
          { id: '2+daily', label: '2+ times daily' },
          { id: 'daily', label: 'Once daily' },
          { id: 'every2', label: 'Every 2 days' },
          { id: 'weekly', label: '1-2 times weekly' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setProfile({ ...profile, frequency: f.id })}
            className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
              profile.frequency === f.id
                ? 'bg-mint border-gold'
                : 'bg-white border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(6)}
        disabled={!profile.frequency}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold disabled:opacity-50"
      >
        Continue
      </button>
    </div>,

    // Reminder
    <div key="reminder" className="text-center">
      <div className="text-6xl mb-4">⏰</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Set a reminder</h2>
      <p className="text-gray-500 mb-6">When should we remind you to log?</p>
      <input
        type="time"
        value={profile.reminderTime}
        onChange={(e) => setProfile({ ...profile, reminderTime: e.target.value })}
        className="w-full p-4 rounded-2xl border-2 border-mint bg-white text-center text-2xl mb-6"
      />
      <button
        onClick={() => setStep(7)}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold"
      >
        Continue
      </button>
    </div>,

    // Complete
    <div key="complete" className="text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">You're all set!</h2>
      <div className="bg-white rounded-2xl p-6 mb-6 text-left">
        <h3 className="font-semibold text-gray-700 mb-3">Your Profile Summary</h3>
        <div className="space-y-2 text-gray-600">
          <p>👤 Name: <span className="font-medium">{profile.name}</span></p>
          <p>🧑 Gender: <span className="font-medium">{profile.gender}</span></p>
          <p>🎯 Goal: <span className="font-medium">{profile.goal}</span></p>
          <p>⏰ Reminder: <span className="font-medium">{profile.reminderTime}</span></p>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold text-lg"
      >
        Start Tracking! 🌿
      </button>
    </div>
  ]

  return (
    <div className="min-h-screen bg-cream flex justify-center">
      <div className="w-full max-w-[430px] p-6 flex flex-col">
        {/* Progress bar */}
        <div className="flex gap-1 mb-8">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-gold' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {steps[step]}
        </div>

        {/* Back button */}
        {step > 0 && step < 7 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mt-4 text-gray-500"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

// Home Tab
function HomeTab({ profile, records }) {
  const today = getDateKey()
  const todayRecord = records[today] || {}
  const gutScore = todayRecord.score || 72

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-500">Good morning,</p>
          <h1 className="text-2xl font-bold text-gray-800">{profile.name || 'Friend'} 👋</h1>
        </div>
        <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center text-2xl">
          🌿
        </div>
      </div>

      {/* Gut Score */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h2 className="text-gray-600 text-center mb-4">Today's Gut Score</h2>
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="12"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#A8E6CF"
              strokeWidth="12"
              strokeDasharray={`${(gutScore / 100) * 440} 440`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-800">{gutScore}%</span>
            <span className="text-gray-500">Score</span>
          </div>
        </div>
        <p className="text-center text-gray-600">
          {gutScore >= 80 ? '🌟 Excellent!' : gutScore >= 60 ? '👍 Good job!' : '💪 Keep going!'}
        </p>
      </div>

      {/* Nutrition Bars */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Today's Nutrition</h3>
        {[
          { name: 'Carbs', value: 65, color: 'bg-yellow-400' },
          { name: 'Protein', value: 45, color: 'bg-red-400' },
          { name: 'Fat', value: 30, color: 'bg-blue-400' },
          { name: 'Fiber', value: 80, color: 'bg-green-400' }
        ].map(n => (
          <div key={n.name} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{n.name}</span>
              <span className="text-gray-500">{n.value}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${n.color} rounded-full transition-all`}
                style={{ width: `${n.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <button className="w-full bg-gold text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2">
        📸 Quick Stool Analysis
      </button>
    </div>
  )
}

// Log Tab
function LogTab({ records, saveRecord }) {
  const [mealTab, setMealTab] = useState('breakfast')
  const [mood, setMood] = useState('')
  const [stoolCount, setStoolCount] = useState(0)
  const [notes, setNotes] = useState('')
  const today = getDateKey()

  const moods = [
    { emoji: '😄', value: 'great' },
    { emoji: '😊', value: 'good' },
    { emoji: '😐', value: 'okay' },
    { emoji: '😣', value: 'bad' },
    { emoji: '😫', value: 'terrible' }
  ]

  const handleSave = () => {
    const score = mood === 'great' ? 90 : mood === 'good' ? 75 : mood === 'okay' ? 60 : mood === 'bad' ? 40 : 25
    saveRecord(today, { feeling: mood, score, memo: notes, stoolCount })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Daily Log 📝</h1>

      {/* Meal Tabs */}
      <div className="flex gap-2 mb-4">
        {['breakfast', 'lunch', 'dinner'].map(meal => (
          <button
            key={meal}
            onClick={() => setMealTab(meal)}
            className={`flex-1 py-3 rounded-2xl font-medium capitalize transition-all ${
              mealTab === meal ? 'bg-gold text-white' : 'bg-white text-gray-600'
            }`}
          >
            {meal === 'breakfast' ? '🌅 ' : meal === 'lunch' ? '☀️ ' : '🌙 '}{meal}
          </button>
        ))}
      </div>

      {/* Photo Upload */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Add Photo</h3>
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-gray-500">Tap to add meal photo</p>
        </div>
      </div>

      {/* Mood Selector */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">How's your gut feeling?</h3>
        <div className="flex justify-between">
          {moods.map(m => (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              className={`text-4xl p-2 rounded-xl transition-all ${
                mood === m.value ? 'bg-mint scale-110' : ''
              }`}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bowel Count */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Bowel Movements Today</h3>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setStoolCount(Math.max(0, stoolCount - 1))}
            className="w-12 h-12 bg-gray-100 rounded-full text-2xl font-bold text-gray-600"
          >
            -
          </button>
          <span className="text-4xl font-bold text-gray-800">{stoolCount}</span>
          <button
            onClick={() => setStoolCount(stoolCount + 1)}
            className="w-12 h-12 bg-mint rounded-full text-2xl font-bold text-gray-700"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How are you feeling today? Any observations..."
          className="w-full h-24 p-3 bg-gray-50 rounded-2xl resize-none border-0 focus:ring-2 focus:ring-mint"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-gold text-white py-4 rounded-2xl font-semibold"
      >
        Save Entry ✅
      </button>
    </div>
  )
}

// History Tab
function HistoryTab({ records }) {
  const [selectedDate, setSelectedDate] = useState(null)
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  const stats = calculateMonthStats(records, viewYear, viewMonth)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']

  // Generate calendar days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const getEmojiForDay = (day) => {
    if (!day) return ''
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const record = records[key]
    if (!record) return ''
    const f = record.feeling
    return f === 'great' ? '😄' : f === 'good' ? '😊' : f === 'okay' ? '😐' : f === 'bad' ? '😣' : '😫'
  }

  // Weekly trend data (last 7 days)
  const weeklyData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = getDateKey(d)
    const record = records[key]
    weeklyData.push({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
      score: record?.score || 0,
      emoji: record?.feeling ? (record.feeling === 'great' ? '😄' : record.feeling === 'good' ? '😊' : record.feeling === 'okay' ? '😐' : '😣') : '—'
    })
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">History 📊</h1>

      {/* Monthly Trend Bar Chart */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Weekly Trend</h3>
        <div className="flex items-end justify-between h-32 gap-1">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <span className="text-xs mb-1">{d.emoji}</span>
              <div
                className="w-full bg-mint rounded-t-lg transition-all"
                style={{ height: `${Math.max(10, d.score)}%` }}
              />
              <span className="text-xs text-gray-500 mt-1">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              if (viewMonth === 0) {
                setViewMonth(11)
                setViewYear(viewYear - 1)
              } else {
                setViewMonth(viewMonth - 1)
              }
            }}
            className="p-2"
          >
            ←
          </button>
          <h3 className="font-semibold text-gray-700">{monthNames[viewMonth]} {viewYear}</h3>
          <button
            onClick={() => {
              if (viewMonth === 11) {
                setViewMonth(0)
                setViewYear(viewYear + 1)
              } else {
                setViewMonth(viewMonth + 1)
              }
            }}
            className="p-2"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-gray-400 py-1">{d}</div>
          ))}
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => day && setSelectedDate(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              className={`py-2 rounded-lg ${
                day ? 'hover:bg-gray-100' : ''
              } ${selectedDate === `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` ? 'bg-mint' : ''}`}
            >
              {day ? (
                <div>
                  <div className="text-gray-700">{day}</div>
                  <div className="text-xs">{getEmojiForDay(day)}</div>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Month Summary */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">How Was Your Gut This Month?</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-600">😄 Good Days</span>
              <span>{stats.goodPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${stats.goodPercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-yellow-600">😐 Okay Days</span>
              <span>{stats.okayPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${stats.okayPercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-600">😣 Bad Days</span>
              <span>{stats.badPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${stats.badPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && records[selectedDate] && (
        <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-3">📅 {selectedDate}</h3>
          <div className="space-y-2 text-gray-600">
            <p>Feeling: {records[selectedDate].feeling}</p>
            <p>Score: {records[selectedDate].score}%</p>
            <p>Bowel Count: {records[selectedDate].stoolCount || 0}</p>
            {records[selectedDate].memo && <p>Notes: {records[selectedDate].memo}</p>}
          </div>
        </div>
      )}

      {/* Monthly Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gold">{stats.monthlyAvg}%</div>
          <div className="text-gray-500 text-sm">Avg Score</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-mint">{stats.total}</div>
          <div className="text-gray-500 text-sm">Days Logged</div>
        </div>
      </div>
    </div>
  )
}

// Insights Tab
function InsightsTab({ records }) {
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your gut health assistant. Ask me anything about your digestive wellness! 🌿' }
  ])
  const [input, setInput] = useState('')

  const today = getDateKey()
  const todayRecord = records[today] || {}

  const bristolScale = [
    { type: 1, desc: 'Separate hard lumps', emoji: '🔴' },
    { type: 2, desc: 'Lumpy, sausage-like', emoji: '🟠' },
    { type: 3, desc: 'Sausage with cracks', emoji: '🟡' },
    { type: 4, desc: 'Smooth, soft sausage', emoji: '🟢' },
    { type: 5, desc: 'Soft blobs with edges', emoji: '🟢' },
    { type: 6, desc: 'Fluffy, mushy pieces', emoji: '🟡' },
    { type: 7, desc: 'Watery, no solid pieces', emoji: '🔴' }
  ]

  const handleSend = () => {
    if (!input.trim()) return
    setChatMessages([
      ...chatMessages,
      { role: 'user', text: input },
      { role: 'ai', text: 'That\'s a great question! Based on your recent logs, I recommend staying hydrated and including more fiber-rich foods. Your gut health is looking good! 💚' }
    ])
    setInput('')
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Insights 💡</h1>

      {/* Daily Report Card */}
      <div className="bg-gradient-to-br from-mint to-green-200 rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">📋 Daily Report</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">💧</div>
            <div className="text-sm text-gray-600">Hydration</div>
            <div className="font-semibold">Good</div>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">🥗</div>
            <div className="text-sm text-gray-600">Fiber</div>
            <div className="font-semibold">80%</div>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">😊</div>
            <div className="text-sm text-gray-600">Mood</div>
            <div className="font-semibold">{todayRecord.feeling || 'N/A'}</div>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 text-center">
            <div className="text-2xl mb-1">🚽</div>
            <div className="text-sm text-gray-600">Bowel</div>
            <div className="font-semibold">{todayRecord.stoolCount || 0}x</div>
          </div>
        </div>
      </div>

      {/* Bristol Stool Scale */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">Bristol Stool Scale</h3>
        <div className="space-y-2">
          {bristolScale.map(b => (
            <div key={b.type} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
              <span className="text-lg">{b.emoji}</span>
              <span className="font-medium text-gray-700">Type {b.type}</span>
              <span className="text-gray-500 text-sm">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Chat */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">🤖 Ask GutBuddy AI</h3>
        <div className="h-48 overflow-y-auto mb-3 space-y-2">
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl ${
                m.role === 'ai'
                  ? 'bg-mint/30 text-gray-700'
                  : 'bg-gold/20 text-gray-700 ml-8'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about gut health..."
            className="flex-1 p-3 bg-gray-50 rounded-2xl border-0"
          />
          <button
            onClick={handleSend}
            className="px-4 py-3 bg-gold text-white rounded-2xl"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// Profile Tab
function ProfileTab({ profile, setProfile }) {
  const levelInfo = getLevelInfo(profile.exp)

  const plans = [
    { id: 'basic', name: 'Basic', price: 'Free', features: ['Daily logging', 'Basic insights', 'History view'] },
    { id: 'pro', name: 'Pro', price: '$9.99/mo', features: ['Everything in Basic', 'AI Analysis', 'Photo recognition', 'Export data'] },
    { id: 'family', name: 'Family', price: '$19.99/mo', features: ['Everything in Pro', 'Up to 5 members', 'Family insights', 'Priority support'] }
  ]

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile 👤</h1>

      {/* Level Card */}
      <div className="bg-gradient-to-br from-gold/20 to-yellow-100 rounded-3xl p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{levelInfo.emoji}</div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
            <p className="text-gray-600">Level {levelInfo.level} • {levelInfo.name}</p>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">EXP</span>
            <span className="text-gray-500">{profile.exp} / {levelInfo.nextLevel?.minExp || 'MAX'}</span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
        {levelInfo.nextLevel && (
          <p className="text-sm text-gray-500">{levelInfo.expForNext} EXP to {levelInfo.nextLevel.name} {levelInfo.nextLevel.emoji}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-gray-800">{profile.streak}</div>
          <div className="text-gray-500 text-sm">Day Streak</div>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
          <div className="text-3xl mb-1">📝</div>
          <div className="text-2xl font-bold text-gray-800">{profile.totalLogs}</div>
          <div className="text-gray-500 text-sm">Total Logs</div>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">🏆 Badges</h3>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map(b => (
            <div
              key={b.id}
              className={`text-center p-2 rounded-xl ${
                profile.badges?.includes(b.id) ? 'bg-gold/10' : 'bg-gray-100 opacity-40'
              }`}
            >
              <div className="text-2xl">{b.emoji}</div>
              <div className="text-xs text-gray-600 mt-1">{b.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Level Progression */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">🌱 Growth Journey</h3>
        <div className="flex justify-between items-center">
          {LEVELS.map((l, i) => (
            <div
              key={l.name}
              className={`text-center ${i + 1 <= levelInfo.level ? '' : 'opacity-30'}`}
            >
              <div className={`text-2xl ${i + 1 === levelInfo.level ? 'scale-125' : ''}`}>{l.emoji}</div>
              <div className="text-xs text-gray-500 mt-1">{l.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">💎 Subscription</h3>
        <div className="space-y-3">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => setProfile({ ...profile, subscription: p.id })}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                profile.subscription === p.id
                  ? 'border-gold bg-gold/5'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">{p.name}</span>
                <span className={`font-bold ${p.id === 'basic' ? 'text-green-600' : 'text-gold'}`}>{p.price}</span>
              </div>
              <ul className="text-sm text-gray-500 space-y-1">
                {p.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Bottom Navigation
function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'log', icon: '✏️', label: 'Log' },
    { id: 'history', icon: '📊', label: 'History' },
    { id: 'insights', icon: '💡', label: 'Insights' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-2 py-2 shadow-lg">
      <div className="flex justify-around">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === t.id ? 'bg-mint/50' : ''
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className={`text-xs ${activeTab === t.id ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
