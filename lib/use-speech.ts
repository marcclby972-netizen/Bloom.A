'use client'

import { useState, useRef, useCallback } from 'react'
import { store } from './store'

type SpeechState = {
  isListening: boolean
  transcript: string
  error: string | null
  retrying: boolean
}

const MAX_NETWORK_RETRIES = 2
const RETRY_DELAY_MS = 1500

export function useSpeech() {
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    transcript: '',
    error: null,
    retrying: false,
  })
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const fullTranscriptRef = useRef('')
  const networkRetriesRef = useRef(0)
  const userStoppedRef = useRef(false)

  const startRecognition = useCallback((isRetry = false) => {
    const SpeechRecognitionAPI = (
      typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : undefined
    )
    if (!SpeechRecognitionAPI) {
      setState((s) => ({ ...s, error: 'La reconnaissance vocale n\'est pas supportée. Utilise Chrome ou Edge.' }))
      return
    }

    const settings = store.getSettings()
    const lang = settings.voice?.language || 'fr-FR'

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    if (!isRetry) fullTranscriptRef.current = ''

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
      fullTranscriptRef.current = (final + interim).trim()
      setState((s) => ({ ...s, transcript: fullTranscriptRef.current, retrying: false }))
      // Reset retry counter on successful result
      networkRetriesRef.current = 0
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Auto-retry on transient network error
      if (event.error === 'network' && !userStoppedRef.current && networkRetriesRef.current < MAX_NETWORK_RETRIES) {
        networkRetriesRef.current++
        setState((s) => ({
          ...s,
          retrying: true,
          error: `Connexion instable, tentative ${networkRetriesRef.current}/${MAX_NETWORK_RETRIES}...`,
        }))
        setTimeout(() => {
          if (!userStoppedRef.current) startRecognition(true)
        }, RETRY_DELAY_MS)
        return
      }

      let errorMsg = ''
      switch (event.error) {
        case 'not-allowed':
          errorMsg = 'Accès au micro refusé. Autorise le micro dans les paramètres du navigateur.'
          break
        case 'no-speech':
          errorMsg = 'Aucune voix détectée. Parle plus fort ou rapproche-toi du micro.'
          break
        case 'network':
          errorMsg = 'Service de reconnaissance vocale indisponible après plusieurs tentatives. Saisis ton texte manuellement, ou réessaie plus tard. Si le problème persiste : ton réseau (FAI, VPN, firewall) bloque peut-être les serveurs Google Speech.'
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
          return
        default:
          errorMsg = `Erreur micro (${event.error}). Essaie de recharger la page.`
      }
      setState((s) => ({ ...s, error: errorMsg, isListening: false, retrying: false }))
    }

    recognition.onend = () => {
      // If we're auto-retrying, don't reset isListening — onstart of the new recognition will keep it
      if (networkRetriesRef.current > 0 && !userStoppedRef.current && state.retrying) return
      setState((s) => ({
        ...s,
        isListening: false,
        retrying: false,
        transcript: fullTranscriptRef.current.trim() || s.transcript,
      }))
    }

    try {
      recognitionRef.current = recognition
      recognition.start()
      if (!isRetry) {
        setState({ isListening: true, transcript: '', error: null, retrying: false })
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        error: `Impossible de démarrer le micro: ${err instanceof Error ? err.message : 'erreur inconnue'}`,
        isListening: false,
        retrying: false,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(async () => {
    // Reset state
    userStoppedRef.current = false
    networkRetriesRef.current = 0

    // Stop any existing session first
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    // Check secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setState((s) => ({
        ...s,
        error: 'L\'enregistrement vocal nécessite HTTPS. Utilisez localhost ou un site sécurisé.',
      }))
      return
    }

    // Check API availability
    const SpeechRecognitionAPI = (
      typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : undefined
    )
    if (!SpeechRecognitionAPI) {
      setState((s) => ({ ...s, error: 'La reconnaissance vocale n\'est pas supportée. Utilise Chrome ou Edge.' }))
      return
    }

    // Pre-flight: request microphone permission explicitly
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch {
      setState((s) => ({
        ...s,
        error: 'Accès au micro refusé. Autorise le micro dans les paramètres du navigateur.',
      }))
      return
    }

    startRecognition(false)
  }, [startRecognition])

  const stop = useCallback(() => {
    userStoppedRef.current = true
    networkRetriesRef.current = 0
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    userStoppedRef.current = true
    networkRetriesRef.current = 0
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    recognitionRef.current = null
    fullTranscriptRef.current = ''
    setState({ isListening: false, transcript: '', error: null, retrying: false })
  }, [])

  return { ...state, start, stop, reset }
}
