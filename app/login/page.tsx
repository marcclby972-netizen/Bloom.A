'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { AI_NAME } from '@/lib/types'
import { cn } from '@/lib/utils'

/* ─── Password strength logic ─── */
type Strength = { score: number; label: string; color: string; text: string }

function getPasswordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '', color: '', text: '' }
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++

  if (s <= 1) return { score: 1, label: 'Faible', color: 'bg-red-500', text: 'text-red-500' }
  if (s === 2) return { score: 2, label: 'Moyen', color: 'bg-orange-400', text: 'text-orange-400' }
  if (s === 3) return { score: 3, label: 'Bon', color: 'bg-amber-500', text: 'text-amber-500' }
  if (s === 4) return { score: 4, label: 'Fort', color: 'bg-emerald-500', text: 'text-emerald-500' }
  return { score: 5, label: 'Excellent', color: 'bg-emerald-500', text: 'text-emerald-500' }
}

/* ─── Reusable field ─── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-stone-500">{label}</label>
      {children}
    </div>
  )
}

/* ─── Strength bar ─── */
function StrengthBar({ password }: { password: string }) {
  const s = useMemo(() => getPasswordStrength(password), [password])
  if (!password) return null
  return (
    <div className="flex items-center gap-2.5 mt-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= s.score ? s.color : 'bg-stone-200')} />
        ))}
      </div>
      <span className={cn('text-[11px] font-medium min-w-[60px] text-right transition-colors', s.text)}>{s.label}</span>
    </div>
  )
}

/* ─── Main page ─── */
type Step = 'auth' | 'verify'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [step, setStep] = useState<Step>('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const passwordMismatch = mode === 'signup' && confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (mode === 'signup' && getPasswordStrength(password).score < 2) {
      setError('Le mot de passe est trop faible')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect' : error.message)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message === 'User already registered' ? 'Cet email est déjà utilisé' : error.message)
      } else {
        setStep('verify')
        setSuccess('Un code de vérification a été envoyé à ' + email)
      }
    }
    setLoading(false)
  }

  /* ── OTP handlers ── */
  const handleOtpInput = (value: string) => {
    setOtpCode(value.replace(/\D/g, '').slice(0, 10))
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpCode.trim()
    if (code.length < 6) { setError('Entre le code complet reçu par email'); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
    if (error) {
      setError(error.message === 'Token has expired or is invalid' ? 'Code expiré ou invalide' : error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError(error.message)
    else {
      setSuccess('Nouveau code envoyé !')
      setOtpCode('')
    }
    setLoading(false)
  }

  const handleGitHub = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } })
  }

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m)
    setError(null)
    setSuccess(null)
    setPassword('')
    setConfirmPassword('')
  }

  /* ── Eye icon ── */
  const EyeToggle = (
    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
      {showPassword ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )

  /* ── Input classes ── */
  const inputCls = 'w-full h-11 rounded-xl bg-white border border-stone-200 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/60 transition-all'

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-stone-50">
      {/* ── Background effects ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] bg-orange-400/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-orange-600/4 rounded-full blur-[100px]" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #9a6a38 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo + branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image src="/bloom-logo-noir.png" alt="Bloom" width={52} height={52} className="rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Bloom</h1>
          <p className="text-stone-400 text-sm mt-1">Propulsé par {AI_NAME}</p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white shadow-xl shadow-stone-200/50 p-7">

          {step === 'verify' ? (
            /* ━━━ OTP VERIFICATION ━━━ */
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-stone-900">Vérifie ton email</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Code envoyé à <span className="text-stone-900 font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="flex justify-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => handleOtpInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 rounded-xl bg-stone-50 border-2 border-stone-200 text-center text-3xl font-bold text-stone-900 tracking-[0.4em] placeholder:tracking-[0.3em] placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/60 transition-all font-mono"
                    autoFocus
                  />
                </div>

                {error && <Alert type="error">{error}</Alert>}
                {success && <Alert type="success">{success}</Alert>}

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full h-11 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-600/20"
                >
                  {loading ? 'Vérification...' : 'Confirmer'}
                </button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-xs text-stone-400">
                  Pas reçu ?{' '}
                  <button onClick={handleResend} disabled={loading} className="text-orange-600 font-medium hover:text-orange-700 disabled:opacity-50">Renvoyer</button>
                </p>
                <button onClick={() => { setStep('auth'); setError(null); setSuccess(null); setOtpCode('') }} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
                  ← Retour
                </button>
              </div>
            </div>
          ) : (
            /* ━━━ LOGIN / SIGNUP ━━━ */
            <div className="space-y-5">
              {/* Tab toggle */}
              <div className="flex rounded-xl bg-stone-100 p-1 gap-1">
                <button
                  onClick={() => switchMode('login')}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                    mode === 'login' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                  )}
                >
                  Connexion
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                    mode === 'signup' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'
                  )}
                >
                  Inscription
                </button>
              </div>

              {/* GitHub OAuth */}
              <button onClick={handleGitHub} className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl bg-stone-900 text-sm font-medium text-white hover:bg-stone-800 transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Continuer avec GitHub
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-stone-400">ou par email</span></div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    required
                    className={inputCls}
                  />
                </Field>

                <Field label="Mot de passe">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className={cn(inputCls, 'pr-10')}
                    />
                    {EyeToggle}
                  </div>
                  <StrengthBar password={password} />
                </Field>

                {mode === 'signup' && (
                  <Field label="Confirmer le mot de passe">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className={cn(
                          inputCls,
                          'pr-10',
                          passwordMismatch && 'border-red-400/60 focus:ring-red-500/40'
                        )}
                      />
                      {confirmPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {password === confirmPassword ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    {passwordMismatch && (
                      <p className="text-[11px] text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                  </Field>
                )}

                {error && <Alert type="error">{error}</Alert>}
                {success && <Alert type="success">{success}</Alert>}

                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && (passwordMismatch || !confirmPassword))}
                  className="w-full h-11 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-orange-600/20"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
                      Chargement...
                    </span>
                  ) : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-6">
          Productivité, CRM et marketing — tout en un.
        </p>
      </div>
    </div>
  )
}

/* ─── Alert component ─── */
function Alert({ type, children }: { type: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div className={cn(
      'rounded-xl px-3.5 py-2.5 text-xs font-medium border',
      type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
    )}>
      {children}
    </div>
  )
}
