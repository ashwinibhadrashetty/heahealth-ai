import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './Auth'


type Page =
  | 'Overview'
  | 'AI Assistant'
  | 'Health Tracker'
  | 'Doctor Summary'
  | 'Learn'

type Symptom = {
  id: string
  date: string
  mood: string
  pain: string
  flow: string
  notes: string
}

type Message = {
  role: 'bot' | 'user'
  text: string
}

const today = () => new Date().toISOString().slice(0, 10)

const initialLessons = [
  {
    icon: '🌸',
    title: 'Understanding your first period',
    category: 'Puberty',
    time: '4 min',
    description:
      'Learn what menstruation is, what to expect, and how to care for yourself.',
  },
  {
    icon: '🩸',
    title: 'Your menstrual cycle',
    category: 'Menstrual health',
    time: '5 min',
    description:
      'Understand the phases of your cycle and how to track your periods.',
  },
  {
    icon: '🌿',
    title: 'Understanding PCOS and PCOD',
    category: 'Hormonal health',
    time: '6 min',
    description:
      'Learn about common symptoms, diagnosis, and when to seek medical advice.',
  },
  {
    icon: '🤰',
    title: 'Pregnancy: the basics',
    category: 'Pregnancy',
    time: '5 min',
    description:
      'An introduction to pregnancy, prenatal appointments, and warning signs.',
  },
]

function getDemoAnswer(question: string) {
  const q = question.toLowerCase()

  if (q.includes('pcos') || q.includes('pcod')) {
    return 'PCOS is a hormonal condition that can cause irregular periods, acne, or increased facial hair. Not everyone has the same symptoms. A healthcare professional can assess your symptoms and decide whether tests or treatment are appropriate. Tracking your cycles can help you prepare for an appointment.'
  }

  if (q.includes('pregnan') || q.includes('missed period')) {
    return 'A missed period can happen for several reasons, including pregnancy, stress, or hormonal changes. If pregnancy is possible, consider taking a home pregnancy test according to its instructions. Seek urgent care for severe abdominal pain, fainting, or heavy bleeding.'
  }

  if (q.includes('pain') || q.includes('cramp')) {
    return 'Mild menstrual cramps are common. Gentle movement, rest, and a warm compress may help. If pain is severe, new, worsening, or interferes with daily activities, consult a healthcare professional. Sudden severe pain needs urgent assessment.'
  }

  if (
    q.includes('irregular') ||
    q.includes('late period') ||
    q.includes('period cycle')
  ) {
    return 'Period timing can vary, but repeatedly irregular periods are worth discussing with a healthcare professional. Pregnancy, stress, thyroid conditions, PCOS, and other factors may contribute. Track your period start dates and symptoms so you can share them at your appointment.'
  }

  if (q.includes('bleed') || q.includes('heavy period')) {
    return 'Bleeding that is much heavier than usual deserves attention. If you soak through a pad or tampon every hour for two consecutive hours, especially with dizziness, breathlessness, or weakness, seek urgent medical care. Track bleeding and contact a clinician for advice.'
  }

  if (q.includes('discharge') || q.includes('itch')) {
    return 'Vaginal discharge can be normal, but a strong or unusual smell, itching, burning, pelvic pain, or an unusual colour can indicate a problem that needs assessment. Avoid self-medicating; contact a healthcare professional if symptoms persist or concern you.'
  }

  if (
    q.includes('fertil') ||
    q.includes('conceive') ||
    q.includes('baby')
  ) {
    return 'Fertility depends on many factors. Irregular ovulation can make conception less predictable, but it does not automatically mean pregnancy is impossible. A clinician can help assess your cycle and discuss suitable next steps.'
  }

  if (
    q.includes('hello') ||
    q.includes('hi ') ||
    q === 'hi' ||
    q.includes('hey')
  ) {
    return 'Hi! 💗 I’m your HERHealth guide. You can ask me about periods, menstrual symptoms, PCOS/PCOD, pregnancy, or general women’s health.'
  }

  return 'Thank you for sharing your question. I can provide general educational information, but I cannot diagnose a condition or prescribe treatment. Could you share a little more about your symptoms, how long they have been happening, and whether anything makes them better or worse? If symptoms are severe or rapidly worsening, seek medical care.'
}

function Dashboard() {
  const [page, setPage] = useState<Page>('Overview')

  const [entries, setEntries] = useState<Symptom[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('herhealth-entries') || '[]',
      ) as Symptom[]
    } catch {
      return []
    }
  })

  const [periodStart, setPeriodStart] = useState(today())
  const [symptomDate, setSymptomDate] = useState(today())
  const [mood, setMood] = useState('Okay')
  const [pain, setPain] = useState('Mild')
  const [flow, setFlow] = useState('Medium')
  const [notes, setNotes] = useState('')
  const [question, setQuestion] = useState('')

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Hi, welcome to HERHealth 💗 Ask me about periods, PCOS/PCOD, pregnancy, or general women’s health. I’ll share general educational information and help you decide when to seek professional care.',
    },
  ])

  const [reportDate, setReportDate] = useState(today())
  const [reportEnd, setReportEnd] = useState(today())
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  // Reference to the lesson content that opens after clicking Explore lesson.
  const lessonDetailRef = useRef<HTMLDivElement | null>(null)

  // Scroll to the lesson only after React has rendered its content.
  useEffect(() => {
    if (selectedLesson === null) return

    const timer = window.setTimeout(() => {
      lessonDetailRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)

    return () => window.clearTimeout(timer)
  }, [selectedLesson])

  useEffect(() => {
    try {
      localStorage.setItem('herhealth-entries', JSON.stringify(entries))
    } catch {
      setNotice(
        'Browser storage is unavailable. Your entries may not be saved.',
      )
    }
  }, [entries])

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  )

  const reportEntries = useMemo(
    () =>
      sortedEntries.filter(
        (entry) => entry.date >= reportDate && entry.date <= reportEnd,
      ),
    [sortedEntries, reportDate, reportEnd],
  )

  function saveSymptom() {
    const entry: Symptom = {
      id: `${Date.now()}-${Math.random()}`,
      date: symptomDate,
      mood,
      pain,
      flow,
      notes: notes.trim(),
    }

    setEntries((current) => [
      entry,
      ...current.filter((item) => item.date !== symptomDate),
    ])

    setNotice('Your health entry has been saved in this browser.')
    setNotes('')
  }

  function logPeriod() {
    const entry: Symptom = {
      id: `${Date.now()}-${Math.random()}`,
      date: periodStart,
      mood: 'Period logged',
      pain: 'Not recorded',
      flow: 'Not recorded',
      notes: 'Period start date',
    }

    setEntries((current) => [
      entry,
      ...current.filter((item) => item.date !== periodStart),
    ])

    setNotice('Period start date saved.')
  }

  function sendQuestion(text = question) {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages((current) => [
      ...current,
      { role: 'user', text: trimmed },
      { role: 'bot', text: getDemoAnswer(trimmed) },
    ])

    setQuestion('')
  }

  const navigation: { name: Page; icon: string }[] = [
    { name: 'Overview', icon: '⌂' },
    { name: 'AI Assistant', icon: '✧' },
    { name: 'Health Tracker', icon: '♡' },
    { name: 'Doctor Summary', icon: '▤' },
    { name: 'Learn', icon: '◉' },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          type="button"
          className="brand"
          onClick={() => setPage('Overview')}
          aria-label="Go to overview"
        >
          <span className="brand-mark">
            H<span>+</span>
          </span>
          <span className="brand-copy">
            HERHealth <small>WOMEN'S WELLNESS</small>
          </span>
        </button>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <button
              type="button"
              key={item.name}
              className={`nav-item ${page === item.name ? 'active' : ''}`}
              onClick={() => {
                setPage(item.name)
                if (item.name !== 'Learn') {
                  setSelectedLesson(null)
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === 'AI Assistant' && (
                <span className="nav-new">AI</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <span className="privacy-icon">♧</span>
            <strong>Your health, your space</strong>
            <p>Keep track of your wellbeing at your own pace.</p>
          </div>

          <div className="profile">
            <div className="avatar">H</div>
            <div>
              <strong>HERHealth User</strong>
              <small>Personal wellness</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            HERHealth <span>+</span>
          </div>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{page}</strong>
          </div>

          <div className="topbar-right">
            <span className="status-dot" /> Your wellness space
            <span className="top-avatar">H</span>
          </div>
        </header>

        <div className="page-content">
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                type="button"
                onClick={() => setNotice('')}
                aria-label="Dismiss notice"
              >
                ×
              </button>
            </div>
          )}

          {/* OVERVIEW */}
          {page === 'Overview' && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="tiny-heart">♥</span> YOUR PERSONAL
                    WELLNESS SPACE
                  </div>

                  <h1>
                    Your health journey,
                    <br />
                    <span>understood.</span>
                  </h1>

                  <p className="welcome-text">
                    A little more understanding, a little more confidence.
                    Your women’s health companion is here for you.
                  </p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setPage('AI Assistant')}
                  >
                    Talk to your health assistant <span>↗</span>
                  </button>
                </div>

                <div
                  className="welcome-art"
                  aria-label="Decorative wellness illustration"
                >
                  <div className="art-orbit orbit-one" />
                  <div className="art-orbit orbit-two" />
                  <div className="art-circle">
                    <span>♡</span>
                  </div>
                  <span className="art-spark spark-one">✦</span>
                  <span className="art-spark spark-two">✧</span>

                  <div className="art-note">
                    <span>✿</span>
                    <div>
                      <strong>You deserve to feel heard.</strong>
                      <small>Every question matters.</small>
                    </div>
                  </div>
                </div>
              </section>

              <div className="section-heading">
                <div>
                  <h2>Your wellness toolkit</h2>
                  <p>Helpful tools for every step of your journey.</p>
                </div>
              </div>

              <section className="tool-grid">
                <button
                  type="button"
                  className="tool-card"
                  onClick={() => setPage('AI Assistant')}
                >
                  <span className="tool-icon lilac">✧</span>
                  <span className="card-arrow">↗</span>
                  <h3>AI Health Assistant</h3>
                  <p>
                    Ask questions about periods, PCOS, pregnancy, and more.
                  </p>
                  <span className="text-link">Start a conversation →</span>
                </button>

                <button
                  type="button"
                  className="tool-card"
                  onClick={() => setPage('Health Tracker')}
                >
                  <span className="tool-icon peach">♡</span>
                  <span className="card-arrow">↗</span>
                  <h3>Health Tracker</h3>
                  <p>
                    Record period dates, symptoms, mood, and daily changes.
                  </p>
                  <span className="text-link">Track your health →</span>
                </button>

                <button
                  type="button"
                  className="tool-card"
                  onClick={() => setPage('Doctor Summary')}
                >
                  <span className="tool-icon mint">▤</span>
                  <span className="card-arrow">↗</span>
                  <h3>Doctor Summary</h3>
                  <p>
                    Organise your recorded health details for appointments.
                  </p>
                  <span className="text-link">View your summary →</span>
                </button>

                <button
                  type="button"
                  className="tool-card"
                  onClick={() => {
                    setSelectedLesson(null)
                    setPage('Learn')
                  }}
                >
                  <span className="tool-icon rose">✿</span>
                  <span className="card-arrow">↗</span>
                  <h3>Learn &amp; Understand</h3>
                  <p>
                    Explore approachable educational lessons about your body.
                  </p>
                  <span className="text-link">Explore lessons →</span>
                </button>
              </section>

              <section className="bottom-grid">
                <div className="panel recent-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent health entries</h2>
                      <p>Your latest recorded updates.</p>
                    </div>

                    <button
                      type="button"
                      className="subtle-button"
                      onClick={() => setPage('Health Tracker')}
                    >
                      View all →
                    </button>
                  </div>

                  {sortedEntries.length === 0 ? (
                    <div className="empty-state">
                      <span>♡</span>
                      <strong>Your story starts here</strong>
                      <p>
                        Record a health entry to begin building your personal
                        timeline.
                      </p>
                      <button
                        type="button"
                        className="outline-button"
                        onClick={() => setPage('Health Tracker')}
                      >
                        Add first entry
                      </button>
                    </div>
                  ) : (
                    sortedEntries.slice(0, 3).map((entry) => (
                      <div className="recent-entry" key={entry.id}>
                        <span className="entry-dot">♡</span>
                        <div>
                          <strong>
                            {entry.mood === 'Period logged'
                              ? 'Period start recorded'
                              : `${entry.date} · Health update`}
                          </strong>
                          <small>
                            {entry.notes ||
                              `Mood: ${entry.mood} · Pain: ${entry.pain}`}
                          </small>
                        </div>
                        <time>{entry.date}</time>
                      </div>
                    ))
                  )}
                </div>

                <div className="panel care-panel">
                  <div className="care-icon">✦</div>
                  <div className="eyebrow">A GENTLE REMINDER</div>
                  <h2>
                    Your wellbeing
                    <br />
                    comes first.
                  </h2>
                  <p>
                    Small steps matter. If something feels different or worries
                    you, it's okay to ask for help from a healthcare
                    professional.
                  </p>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setPage('Learn')}
                  >
                    Explore health guides ↗
                  </button>
                </div>
              </section>

              <p className="disclaimer">
                HERHealth provides general educational support, not a diagnosis
                or a substitute for professional medical care.
              </p>
            </>
          )}

          {/* AI ASSISTANT */}
          {page === 'AI Assistant' && (
            <section className="subpage">
              <div className="page-intro">
                <div className="eyebrow">HERE FOR YOUR QUESTIONS</div>
                <h1>
                  Your health, <span>your questions.</span>
                </h1>
                <p>
                  A welcoming space to explore women’s health topics without
                  judgement.
                </p>
              </div>

              <div className="chat-layout">
                <div className="chat-panel">
                  <div className="chat-header">
                    <div className="bot-avatar">✧</div>
                    <div>
                      <strong>HERHealth Assistant</strong>
                      <small>
                        <span className="status-dot" /> General health
                        information
                      </small>
                    </div>
                    <span className="demo-tag">DEMO</span>
                  </div>

                  <div className="chat-messages" aria-live="polite">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`message-row ${message.role}`}
                      >
                        <div className="message-avatar">
                          {message.role === 'bot' ? 'H' : 'Y'}
                        </div>
                        <div className="message-bubble">{message.text}</div>
                      </div>
                    ))}
                  </div>

                  <div className="suggestions">
                    <span>TRY ASKING</span>
                    {[
                      'Why are my periods irregular?',
                      'What is PCOS?',
                      'How can I manage cramps?',
                    ].map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => sendQuestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <form
                    className="chat-input"
                    onSubmit={(event) => {
                      event.preventDefault()
                      sendQuestion()
                    }}
                  >
                    <input
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="Ask a question about your health..."
                      aria-label="Your health question"
                    />
                    <button type="submit" disabled={!question.trim()}>
                      Send <span>↑</span>
                    </button>
                  </form>

                  <p className="chat-disclaimer">
                    Demo responses only · Not for emergencies, diagnosis, or
                    prescriptions.
                  </p>
                </div>

                <aside className="chat-side panel">
                  <span className="tool-icon lilac">♡</span>
                  <h3>A safe space to learn</h3>
                  <p>
                    There are no silly questions when it comes to understanding
                    your health.
                  </p>
                  <div className="side-divider" />
                  <strong>Topics you can explore</strong>

                  {[
                    'Menstrual health',
                    'PCOS / PCOD',
                    'Pregnancy basics',
                    'Symptoms & wellbeing',
                  ].map((topic) => (
                    <div className="topic-row" key={topic}>
                      <span>✓</span>
                      {topic}
                    </div>
                  ))}

                  <div className="safety-note">
                    For severe symptoms or urgent concerns, contact a healthcare
                    professional or emergency service.
                  </div>
                </aside>
              </div>
            </section>
          )}

          {/* HEALTH TRACKER */}
          {page === 'Health Tracker' && (
            <section className="subpage">
              <div className="page-intro">
                <div className="eyebrow">GET TO KNOW YOUR PATTERNS</div>
                <h1>
                  Your health, <span>at a glance.</span>
                </h1>
                <p>
                  Record your cycle and symptoms. Your entries are saved in this
                  browser.
                </p>
              </div>

              <div className="tracker-grid">
                <div className="panel form-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Log a period start</h2>
                      <p>Record the first day of your period.</p>
                    </div>
                    <span className="tool-icon peach">♡</span>
                  </div>

                  <label>
                    Period start date
                    <input
                      type="date"
                      value={periodStart}
                      max={today()}
                      onChange={(event) => setPeriodStart(event.target.value)}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary-button full-button"
                    onClick={logPeriod}
                  >
                    Save period date <span>→</span>
                  </button>

                  <p className="field-help">
                    Cycle predictions are not provided. Cycle patterns vary
                    between people.
                  </p>
                </div>

                <div className="panel form-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Daily health check-in</h2>
                      <p>How have you been feeling?</p>
                    </div>
                    <span className="tool-icon mint">✿</span>
                  </div>

                  <label>
                    Date
                    <input
                      type="date"
                      value={symptomDate}
                      max={today()}
                      onChange={(event) => setSymptomDate(event.target.value)}
                    />
                  </label>

                  <label>
                    Mood
                    <select
                      value={mood}
                      onChange={(event) => setMood(event.target.value)}
                    >
                      <option>Okay</option>
                      <option>Happy</option>
                      <option>Anxious</option>
                      <option>Low</option>
                      <option>Tired</option>
                    </select>
                  </label>

                  <label>
                    Pain level
                    <select
                      value={pain}
                      onChange={(event) => setPain(event.target.value)}
                    >
                      <option>None</option>
                      <option>Mild</option>
                      <option>Moderate</option>
                      <option>Severe</option>
                    </select>
                  </label>

                  <label>
                    Bleeding / flow
                    <select
                      value={flow}
                      onChange={(event) => setFlow(event.target.value)}
                    >
                      <option>Not applicable</option>
                      <option>Spotting</option>
                      <option>Light</option>
                      <option>Medium</option>
                      <option>Heavy</option>
                    </select>
                  </label>

                  <label>
                    Notes
                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Symptoms, changes, or questions to discuss with your doctor..."
                      rows={3}
                    />
                  </label>

                  <button
                    type="button"
                    className="primary-button full-button"
                    onClick={saveSymptom}
                  >
                    Save health entry <span>→</span>
                  </button>
                </div>
              </div>

              <div className="panel history-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Your health timeline</h2>
                    <p>
                      {entries.length} recorded{' '}
                      {entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                </div>

                {sortedEntries.length === 0 ? (
                  <div className="empty-state">
                    <span>♡</span>
                    <strong>No entries yet</strong>
                    <p>Your saved entries will appear here.</p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Mood</th>
                          <th>Pain</th>
                          <th>Flow</th>
                          <th>Notes</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.date}</td>
                            <td>
                              {entry.mood === 'Period logged'
                                ? 'Period start'
                                : 'Check-in'}
                            </td>
                            <td>{entry.mood}</td>
                            <td>{entry.pain}</td>
                            <td>{entry.flow}</td>
                            <td>{entry.notes || '—'}</td>
                            <td>
                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  setEntries((current) =>
                                    current.filter(
                                      (item) => item.id !== entry.id,
                                    ),
                                  )
                                }
                                aria-label={`Delete entry for ${entry.date}`}
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <p className="disclaimer">
                These records are self-reported and do not determine whether
                you have a medical condition.
              </p>
            </section>
          )}

          {/* DOCTOR SUMMARY */}
          {page === 'Doctor Summary' && (
            <section className="subpage">
              <div className="page-intro">
                <div className="eyebrow">PREPARE FOR YOUR APPOINTMENT</div>
                <h1>
                  Your story, <span>clearly organised.</span>
                </h1>
                <p>
                  Create a printable summary of your recorded symptoms to
                  discuss with your clinician.
                </p>
              </div>

              <div className="panel report-filters">
                <label>
                  From date
                  <input
                    type="date"
                    value={reportDate}
                    max={reportEnd}
                    onChange={(event) => setReportDate(event.target.value)}
                  />
                </label>

                <label>
                  To date
                  <input
                    type="date"
                    value={reportEnd}
                    min={reportDate}
                    max={today()}
                    onChange={(event) => setReportEnd(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => window.print()}
                >
                  Print / Save as PDF ↗
                </button>
              </div>

              <div className="panel report-paper" id="doctor-report">
                <div className="report-brand">
                  <span className="brand-mark">
                    H<span>+</span>
                  </span>
                  <div>
                    <strong>HERHealth</strong>
                    <small>PERSONAL HEALTH SUMMARY</small>
                  </div>
                </div>

                <div className="report-title">
                  <div>
                    <div className="eyebrow">PATIENT-PREPARED REPORT</div>
                    <h2>Health visit summary</h2>
                    <p>
                      Period covered: {reportDate} to {reportEnd}
                    </p>
                  </div>
                  <span className="report-count">
                    {reportEntries.length}
                    <small>ENTRIES</small>
                  </span>
                </div>

                <div className="report-callout">
                  This summary contains self-reported information for
                  discussion with a healthcare professional. It is not a
                  medical diagnosis.
                </div>

                <h3>Recorded health history</h3>

                {reportEntries.length === 0 ? (
                  <div className="empty-state">
                    <span>▤</span>
                    <strong>No entries in this date range</strong>
                    <p>
                      Try another date range or add entries in Health Tracker.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Entry</th>
                          <th>Mood</th>
                          <th>Pain</th>
                          <th>Flow</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.date}</td>
                            <td>
                              {entry.mood === 'Period logged'
                                ? 'Period start'
                                : 'Check-in'}
                            </td>
                            <td>{entry.mood}</td>
                            <td>{entry.pain}</td>
                            <td>{entry.flow}</td>
                            <td>{entry.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h3>Questions for my clinician</h3>
                <ul className="report-questions">
                  <li>What might explain my symptoms or cycle changes?</li>
                  <li>Do I need an examination or any tests?</li>
                  <li>What symptoms should prompt urgent medical attention?</li>
                </ul>

                <div className="report-footer">
                  Generated on {today()} · HERHealth wellness tracker · Please
                  verify this information before relying on it clinically.
                </div>
              </div>

              <p className="disclaimer">
                Your report includes only entries saved in this browser and
                selected date range. It does not create a prescription.
              </p>
            </section>
          )}

          {/* LEARN */}
          {page === 'Learn' && (
            <section className="subpage">
              <div className="page-intro">
                <div className="eyebrow">KNOWLEDGE BUILDS CONFIDENCE</div>
                <h1>
                  Learn about <span>your body.</span>
                </h1>
                <p>
                  Friendly, easy-to-understand introductions to women’s health
                  topics.
                </p>
              </div>

              <div className="lesson-grid">
                {initialLessons.map((lesson, index) => (
                  <article className="lesson-card" key={lesson.title}>
                    <div className={`lesson-art lesson-art-${index}`}>
                      <span>{lesson.icon}</span>
                      <small>{lesson.category}</small>
                    </div>

                    <div className="lesson-body">
                      <div className="lesson-meta">
                        {lesson.category}
                        <span>{lesson.time} read</span>
                      </div>

                      <h3>{lesson.title}</h3>
                      <p>{lesson.description}</p>

                      {/* FIXED: explicitly triggers the lesson content */}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setSelectedLesson(index)}
                      >
                        Explore lesson ↗
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Lesson details appear when a card's button is clicked */}
              {selectedLesson !== null && (
                <div
                  className="panel lesson-detail"
                  ref={lessonDetailRef}
                  tabIndex={-1}
                >
                  <button
                    type="button"
                    className="close-detail"
                    onClick={() => setSelectedLesson(null)}
                  >
                    Close ×
                  </button>

                  <div className="eyebrow">
                    LEARNING GUIDE ·{' '}
                    {initialLessons[selectedLesson].category.toUpperCase()}
                  </div>

                  <h2>{initialLessons[selectedLesson].title}</h2>
                  <p>{initialLessons[selectedLesson].description}</p>

                  {selectedLesson === 0 && (
                    <>
                      <h3>What is a period?</h3>
                      <p>
                        Menstruation is when blood and tissue from the lining
                        of the uterus leave the body through the vagina. It is
                        a normal part of puberty for many people. The first
                        period often happens between ages 8 and 15, but timing
                        varies.
                      </p>

                      <h3>How can you prepare?</h3>
                      <p>
                        Learn how to use menstrual products, keep spare
                        supplies, and talk with a trusted adult or healthcare
                        professional if you have questions. Seek medical advice
                        for very heavy bleeding or severe pain.
                      </p>
                    </>
                  )}

                  {selectedLesson === 1 && (
                    <>
                      <h3>What is the cycle?</h3>
                      <p>
                        The menstrual cycle is counted from the first day of
                        one period to the first day of the next. Hormones
                        coordinate changes in the ovaries and uterus. Cycle
                        length and symptoms can vary, especially during the
                        first years after periods begin.
                      </p>

                      <h3>What should you track?</h3>
                      <p>
                        Record period start dates, bleeding, pain, and other
                        symptoms. Repeatedly irregular cycles or a gap of
                        around 90 days between periods deserves medical
                        assessment.
                      </p>
                    </>
                  )}

                  {selectedLesson === 2 && (
                    <>
                      <h3>What is PCOS?</h3>
                      <p>
                        Polycystic ovary syndrome (PCOS) is a hormonal
                        condition that may be associated with irregular
                        ovulation, acne, or increased facial/body hair.
                        Symptoms differ, and diagnosis requires a healthcare
                        professional's assessment. An ultrasound alone does
                        not confirm PCOS in every case.
                      </p>

                      <h3>What can help?</h3>
                      <p>
                        A clinician can discuss your symptoms, health history,
                        and whether tests are needed. Treatment depends on your
                        needs and goals; do not start medication or supplements
                        without appropriate advice.
                      </p>
                    </>
                  )}

                  {selectedLesson === 3 && (
                    <>
                      <h3>Looking after yourself during pregnancy</h3>
                      <p>
                        Prenatal care helps monitor the health of the pregnant
                        person and developing baby. If pregnancy is possible,
                        a home test can help, and a healthcare professional can
                        advise on next steps.
                      </p>

                      <h3>When to seek urgent care</h3>
                      <p>
                        Urgent assessment is important for heavy bleeding,
                        severe abdominal pain, fainting, severe headache,
                        breathing difficulty, or other alarming symptoms
                        during pregnancy.
                      </p>
                    </>
                  )}

                  <div className="safety-note">
                    This is general educational content, not personalised
                    medical advice. Talk to a qualified healthcare professional
                    about your situation.
                  </div>
                </div>
              )}

              <div className="panel learning-note">
                <span className="tool-icon mint">✧</span>
                <div>
                  <h3>Prefer learning by watching?</h3>
                  <p>
                    This prototype has lesson cards and written explanations.
                    It does not yet generate animated videos or voice narration.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(
    undefined,
  )

  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        console.error('Unable to load Supabase session:', error.message)
        setAuthError('Unable to check your login. Please refresh the page.')
        setSession(null)
        return
      }

      setSession(data.session)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setAuthError('')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setAuthError(error.message)
    }
  }

  if (session === undefined) {
    return (
      <main style={{ padding: '40px', textAlign: 'center' }}>
        Loading HERHealth...
      </main>
    )
  }

  if (authError && !session) {
    return (
      <main style={{ padding: '40px', textAlign: 'center' }}>
        <p>{authError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Try again
        </button>
      </main>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px 20px',
          background: '#fff7fa',
        }}
      >
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>
      <Dashboard />
    </>
  )
}
