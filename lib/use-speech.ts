'use client'

import { useState, useRef, useCallback } from 'react'
import { store } from './store'

type SpeechState = {
  isListening: boolean
  transcript: string
  error: string | null
}

export function useSpeech() {
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    transcript: '',
    error: null,
  })
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const fullTranscriptRef = useRef('')

  const start = useCallback(() => {
    // Stop any existing session first
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const SpeechRecognitionAPI = (
      typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : undefined
    )

    if (!SpeechRecognitionAPI) {
      setState((s) => ({
        ...s,
        error: 'La reconnaissance vocale n\'est pas supportée. Utilise Chrome ou Edge.',
      }))
      return
    }

    const settings = store.getSettings()
    const lang = settings.voice?.language || 'fr-FR'

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    fullTranscriptRef.current = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      fullTranscriptRef.current = final
      setState((s) => ({ ...s, transcript: (final + interim).trim() }))
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMsg = ''
      switch (event.error) {
        case 'not-allowed':
          errorMsg = 'Accès au micro refusé. Autorise le micro dans les paramètres du navigateur.'
          break
        case 'no-speech':
          errorMsg = 'Aucune voix détectée. Réessaie en parlant plus fort.'
          break
        case 'network':
          errorMsg = 'Erreur réseau. Vérifie ta connexion internet.'
          break
        case 'aborted':
          // User stopped — not a real error
          return
        default:
          errorMsg = `Erreur micro: ${event.error}`
      }
      setState((s) => ({ ...s, error: errorMsg, isListening: false }))
    }

    recognition.onend = () => {
      setState((s) => ({
        ...s,
        isListening: false,
        transcript: fullTranscriptRef.current.trim() || s.transcript,
      }))
    }

    try {
      recognitionRef.current = recognition
      recognition.start()
      setState({ isListening: true, transcript: '', error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        error: `Impossible de démarrer le micro: ${err instanceof Error ? err.message : 'erreur inconnue'}`,
        isListening: false,
      }))
    }
  }, [])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    setState((s) => ({ ...s, isListening: false }))
  }, [])

  const reset = useCallback(() => {
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    recognitionRef.current = null
    fullTranscriptRef.current = ''
    setState({ isListening: false, transcript: '', error: null })
  }, [])

  return { ...state, start, stop, reset }
}
