import { useState, useRef, useImperativeHandle, forwardRef } from 'react'

const SwipeCard = forwardRef(({ children, onSwipe, onCardLeftScreen, preventSwipe = [] }, ref) => {
  const cardRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const startPos = useRef({ x: 0, y: 0 })

  const SWIPE_THRESHOLD = 100
  const FLY_DISTANCE = 1000

  useImperativeHandle(ref, () => ({
    swipe(dir) {
      programmaticSwipe(dir)
    }
  }))

  const programmaticSwipe = (dir) => {
    const xEnd = dir === 'left' ? -FLY_DISTANCE : FLY_DISTANCE
    setPosition({ x: xEnd, y: 0 })
    setRotation(dir === 'left' ? -30 : 30)
    setIsLeaving(true)
    if (onSwipe) onSwipe(dir)
    setTimeout(() => {
      if (onCardLeftScreen) onCardLeftScreen()
    }, 300)
  }

  const handleStart = (clientX, clientY) => {
    setIsDragging(true)
    startPos.current = { x: clientX - position.x, y: clientY - position.y }
  }

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return
    const newX = clientX - startPos.current.x
    const newY = clientY - startPos.current.y
    const clampedY = preventSwipe.includes('up') && preventSwipe.includes('down') ? 0 : newY
    setPosition({ x: newX, y: clampedY })
    setRotation(newX * 0.08)
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (Math.abs(position.x) > SWIPE_THRESHOLD) {
      const dir = position.x > 0 ? 'right' : 'left'
      if (preventSwipe.includes(dir)) {
        setPosition({ x: 0, y: 0 })
        setRotation(0)
        return
      }
      const xEnd = dir === 'left' ? -FLY_DISTANCE : FLY_DISTANCE
      setPosition({ x: xEnd, y: 0 })
      setRotation(dir === 'left' ? -30 : 30)
      setIsLeaving(true)
      if (onSwipe) onSwipe(dir)
      setTimeout(() => {
        if (onCardLeftScreen) onCardLeftScreen()
      }, 300)
    } else {
      setPosition({ x: 0, y: 0 })
      setRotation(0)
    }
  }

  const onMouseDown = (e) => handleStart(e.clientX, e.clientY)
  const onMouseMove = (e) => handleMove(e.clientX, e.clientY)
  const onMouseUp = () => handleEnd()

  const onTouchStart = (e) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }
  const onTouchMove = (e) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }
  const onTouchEnd = () => handleEnd()

  const opacity = isLeaving ? 0 : 1
  const swipeRatio = Math.min(Math.abs(position.x) / SWIPE_THRESHOLD, 1)

  return (
    <div
      ref={cardRef}
      className="swipe-card"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        opacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe overlays */}
      <div
        className="swipe-overlay like-overlay"
        style={{ opacity: position.x > 0 ? swipeRatio : 0 }}
      >
        LIKE
      </div>
      <div
        className="swipe-overlay nope-overlay"
        style={{ opacity: position.x < 0 ? swipeRatio : 0 }}
      >
        NOPE
      </div>
      {children}
    </div>
  )
})

SwipeCard.displayName = 'SwipeCard'

export default SwipeCard
