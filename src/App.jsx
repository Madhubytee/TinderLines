import { useState, useEffect, useRef, useCallback } from 'react'
import SwipeCard from './SwipeCard'
import { FiX, FiHeart, FiCopy, FiTrash2 } from 'react-icons/fi'
import './App.css'

const API_URL = 'https://rizzapi.vercel.app/random'
const BATCH_SIZE = 15

function App() {
  const [lines, setLines] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [savedLines, setSavedLines] = useState(() => {
    const stored = localStorage.getItem('savedLines')
    return stored ? JSON.parse(stored) : []
  })
  const [view, setView] = useState('swipe')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const cardRefs = useRef([])

  useEffect(() => {
    localStorage.setItem('savedLines', JSON.stringify(savedLines))
  }, [savedLines])

  const fetchLines = useCallback(async () => {
    setLoading(true)
    try {
      const promises = Array.from({ length: BATCH_SIZE }, () =>
        fetch(API_URL).then(res => res.json())
      )
      const results = await Promise.all(promises)
      const newLines = results.map(r => ({
        id: r._id || crypto.randomUUID(),
        text: r.text,
        category: r.category || 'Pickup Line',
      }))
      setLines(newLines)
      setCurrentIndex(newLines.length - 1)
      cardRefs.current = newLines.map(() => null)
    } catch {
      showToast('Failed to load lines')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLines()
  }, [fetchLines])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const swiped = (direction, line) => {
    if (direction === 'right') {
      setSavedLines(prev => {
        if (prev.some(l => l.id === line.id)) return prev
        return [line, ...prev]
      })
      showToast('Saved! Rizz secured')
    }
    setCurrentIndex(prev => prev - 1)
  }

  useEffect(() => {
    if (currentIndex < 0 && !loading && lines.length > 0) {
      fetchLines()
    }
  }, [currentIndex, loading, lines.length, fetchLines])

  const swipeBtn = useCallback((dir) => {
    if (currentIndex >= 0 && currentIndex < lines.length && cardRefs.current[currentIndex]) {
      cardRefs.current[currentIndex].swipe(dir)
    }
  }, [currentIndex, lines.length])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (view !== 'swipe') return
      if (e.key === 'ArrowLeft') swipeBtn('left')
      if (e.key === 'ArrowRight') swipeBtn('right')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, swipeBtn])

  const copyLine = () => {
    if (currentIndex >= 0 && currentIndex < lines.length) {
      navigator.clipboard.writeText(lines[currentIndex].text)
      showToast('Copied to clipboard!')
    }
  }

  const copySavedLine = (text) => {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!')
  }

  const removeSaved = (id) => {
    setSavedLines(prev => prev.filter(l => l.id !== id))
  }

  const clearAll = () => {
    setSavedLines([])
    showToast('All lines cleared')
  }

  return (
    <div className="app">
      <div className="header">
        <h1>TinderLines</h1>
        <p>Swipe right to secure the rizz</p>
      </div>

      <div className="nav-tabs">
        <button
          className={view === 'swipe' ? 'active' : ''}
          onClick={() => setView('swipe')}
        >
          Swipe
        </button>
        <button
          className={view === 'saved' ? 'active' : ''}
          onClick={() => setView('saved')}
        >
          Saved
          {savedLines.length > 0 && (
            <span className="saved-count">{savedLines.length}</span>
          )}
        </button>
      </div>

      {view === 'swipe' ? (
        <>
          <div className="card-container">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner" />
                <span>Loading rizz...</span>
              </div>
            ) : (
              lines.map((line, index) => (
                <SwipeCard
                  ref={(el) => { cardRefs.current[index] = el }}
                  key={line.id}
                  onSwipe={(dir) => swiped(dir, line)}
                  onCardLeftScreen={() => {}}
                  preventSwipe={['up', 'down']}
                >
                  <div className="card">
                    <span className="card-category">{line.category}</span>
                    <p className="card-text">{line.text}</p>
                    <span className="card-hint">swipe or use buttons below</span>
                  </div>
                </SwipeCard>
              ))
            )}
          </div>

          <div className="status-msg">{toast || '\u00A0'}</div>

          <div className="actions">
            <button className="action-btn nope" onClick={() => swipeBtn('left')}>
              <FiX />
            </button>
            <button className="action-btn copy" onClick={copyLine}>
              <FiCopy />
            </button>
            <button className="action-btn like" onClick={() => swipeBtn('right')}>
              <FiHeart />
            </button>
          </div>
        </>
      ) : (
        <div className="saved-container">
          {savedLines.length === 0 ? (
            <div className="saved-empty">
              <div className="empty-icon">
                <FiHeart />
              </div>
              <p>No saved lines yet.<br />Swipe right on lines you like!</p>
            </div>
          ) : (
            <>
              {savedLines.map(line => (
                <div key={line.id} className="saved-line">
                  <div>
                    <div className="saved-line-text">{line.text}</div>
                    <div className="saved-line-category">{line.category}</div>
                  </div>
                  <div className="saved-line-actions">
                    <button className="saved-btn" onClick={() => copySavedLine(line.text)}>
                      <FiCopy />
                    </button>
                    <button className="saved-btn delete" onClick={() => removeSaved(line.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
              <button className="clear-all-btn" onClick={clearAll}>
                Clear All
              </button>
            </>
          )}
        </div>
      )}

    </div>
  )
}

export default App
