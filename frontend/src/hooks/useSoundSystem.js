import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook for managing immersive audio system
 * Handles ambient background sound and interaction sound effects
 */
export function useSoundSystem() {
  const ambientRef = useRef(null)
  const clickRef = useRef(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const userInteractedRef = useRef(false)

  useEffect(() => {
    // Initialize audio objects
    // Using .wav files (generated) - user can replace with .mp3 if desired
    ambientRef.current = new Audio('/sounds/ambient.wav')
    clickRef.current = new Audio('/sounds/click.wav')

    // Configure ambient sound
    if (ambientRef.current) {
      ambientRef.current.loop = true
      ambientRef.current.volume = 0.3
    }

    // Configure click sound
    if (clickRef.current) {
      clickRef.current.volume = 0.6
    }

    // Attempt to start ambient sound (will fail if user hasn't interacted)
    const tryPlayAmbient = async () => {
      try {
        if (ambientRef.current && !userInteractedRef.current) {
          await ambientRef.current.play()
          setIsInitialized(true)
        }
      } catch (error) {
        // Autoplay blocked - will retry on first user interaction
        console.log('Ambient sound will start on first user interaction')
      }
    }

    tryPlayAmbient()

    // Handle first user interaction to start audio
    const handleFirstInteraction = async () => {
      if (!userInteractedRef.current) {
        userInteractedRef.current = true
        
        try {
          if (ambientRef.current && ambientRef.current.paused) {
            await ambientRef.current.play()
            setIsInitialized(true)
          }
        } catch (error) {
          console.error('Error starting ambient sound:', error)
        }
      }
    }

    // Listen for first user interaction
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true })
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction)
      })
      
      if (ambientRef.current) {
        ambientRef.current.pause()
        ambientRef.current = null
      }
      if (clickRef.current) {
        clickRef.current = null
      }
    }
  }, [])

  const playClick = () => {
    // Mark user as interacted if they click
    if (!userInteractedRef.current) {
      userInteractedRef.current = true
      // Try to start ambient sound on first click
      if (ambientRef.current && ambientRef.current.paused) {
        ambientRef.current.play().catch(error => {
          console.error('Error starting ambient sound on click:', error)
        })
      }
    }
    
    if (clickRef.current) {
      // Reset to start and play
      clickRef.current.currentTime = 0
      clickRef.current.play().catch(error => {
        console.error('Error playing click sound:', error)
      })
    }
  }

  const stopAmbient = () => {
    if (ambientRef.current) {
      ambientRef.current.pause()
      ambientRef.current.currentTime = 0
    }
  }

  const resumeAmbient = () => {
    if (ambientRef.current && userInteractedRef.current) {
      ambientRef.current.play().catch(error => {
        console.error('Error resuming ambient sound:', error)
      })
    }
  }

  return {
    playClick,
    stopAmbient,
    resumeAmbient,
    isInitialized
  }
}

