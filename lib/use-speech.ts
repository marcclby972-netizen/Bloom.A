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

  const start = useCallback(async () => {
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

    // Check secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setState((s) => ({
        ...s,
        error: 'L\'enregistrement vocal nécessite HTTPS. Utilisez localhost ou un site sécurisé.',
      }))
      return
    }

    // Pre-flight: request microphone permission explicitly
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Stop tracks immediately — we just needed the permission
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch {
      setState((s) => ({
        ...s,
        error: 'Accès au micro refusé. Autorise le micro dans les paramètres du navigateur.',
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
      // Keep final + latest interim so a mid-phrase stop preserves text
      fullTranscriptRef.current = (final + interim).trim()
      setState((s) => ({ ...s, transcript: fullTranscriptRef.current }))
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMsg = ''
      switch (event.error) {
        case 'not-allowed':
          errorMsg = 'Accès au micro refusé. Autorise le micro dans les paramètres du navigateur.'
          break
        case 'no-speech':
          errorMsg = 'Aucune voix détectée. Parle plus fort ou rapproche-toi du micro.'
          break
        case 'network':
          errorMsg = 'Erreur de connexion à Google Speech. La reconnaissance vocale nécessite Internet. Vérifie ta connexion ou utilise un autre navigateur (Chrome / Edge / Safari).'
          break
        case 'service-not-allowed':
          errorMsg = 'Le service de reconnaissance vocale est bloqué. Utilise Chrome ou Edge.'
          break
        case 'audio-capture':
          errorMsg = 'Aucun micro détecté. Vérifie que ton micro fonctionne.'
          break
        case 'language-not-supported':
          errorMsg = 'Langue non supportée par le navigateur. Change la langue dans Paramètres → Voix.'
          break
        case 'aborted':
          // User stopped — not a real error
          return
        default:
          errorMsg = `Erreur micro (${event.error}). Essaie de recharger la page.`
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
    // Don't set isListening synchronously — let onend do it so transcript is finalized
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    recognitionRef.current = null
    fullTranscriptRef.current = ''
    setState({ isListening: false, transcript: '', error: null })
  }, [])

  return { ...state, start, stop, reset }
}
