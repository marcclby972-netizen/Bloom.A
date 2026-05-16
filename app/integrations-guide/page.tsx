'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/supabase/use-auth'
import { isAdmin } from '@/lib/admin'

type Platform = 'overview' | 'youtube' | 'linkedin'

const SESSION_KEY = 'bloom_guide_unlocked'

const PLATFORMS: { id: Platform; label: string; difficulty: string; time: string; reviewTime: string }[] = [
  { id: 'overview', label: "Vue d'ensemble", difficulty: '—', time: '—', reviewTime: '—' },
  { id: 'youtube', label: 'YouTube', difficulty: 'Facile', time: '10 min', reviewTime: 'Instant' },
  { id: 'linkedin', label: 'LinkedIn', difficulty: 'Facile', time: '15 min', reviewTime: 'Instant' },
]

export default function IntegrationsGuidePage() {
  const { user, loading: authLoading } = useAuth()
  const [activePlatform, setActivePlatform] = useState<Platform>('overview')
  const [origin, setOrigin] = useState('https://ton-domaine.vercel.app')
  const [unlocked, setUnlocked] = useState(false)
  const [checking, setChecking] = useState(true)

  // Admin gate — render an explicit forbidden screen for non-admins
  const userIsAdmin = isAdmin(user?.email)
  const adminGateActive = !authLoading && !userIsAdmin

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
      setUnlocked(sessionStorage.getItem(SESSION_KEY) === '1')
      setChecking(false)
    }
  }, [])

  if (checking || authLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chargement...</div>
  }

  if (adminGateActive) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold mb-2">Accès réservé aux admins</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Cette section documente la configuration technique des intégrations OAuth
            (création des apps Developer, env vars, etc.). Elle est réservée à l&apos;équipe
            qui maintient l&apos;app.
          </p>
          <Link href="/" className="pill pill-dark text-sm py-3 px-5 inline-flex">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="8" cy="8" r="7" />
                <path d="M8 5v3" />
                <path d="M8 11v.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Guide des intégrations</h1>
              <p className="text-xs text-muted-foreground">Tutoriel pas à pas pour connecter chaque réseau social</p>
            </div>
          </div>
        </div>
        <div className="h-px gradient-line" />
      </div>

      {/* Platform tabs */}
      <div className="shrink-0 border-b border-border px-4 sm:px-6 overflow-x-auto">
        <div className="flex items-center gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={cn(
                'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activePlatform === p.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          {activePlatform === 'overview' && <Overview origin={origin} />}
          {activePlatform === 'youtube' && <YouTubeGuide origin={origin} />}
          {activePlatform === 'linkedin' && <LinkedInGuide origin={origin} />}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Reusable building blocks
// ════════════════════════════════════════════════════════════════════════

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {num}
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 pb-6">
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="relative bg-muted/50 rounded-md p-3 my-2">
      {label && <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>}
      <div className="font-mono text-xs text-foreground break-all pr-16">{value}</div>
      <button
        onClick={copy}
        className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-background border border-border hover:bg-muted"
      >
        {copied ? 'Copié' : 'Copier'}
      </button>
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3 text-xs text-amber-900 dark:text-amber-200 my-2">
      <strong>Attention :</strong> {children}
    </div>
  )
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/50 p-3 text-xs text-blue-900 dark:text-blue-200 my-2">
      {children}
    </div>
  )
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium inline-flex items-center gap-0.5">
      {children}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 1.5h4.5v4.5" />
        <path d="M8.5 1.5L4 6" />
        <path d="M7.5 6.5v2h-6v-6h2" />
      </svg>
    </a>
  )
}

// ════════════════════════════════════════════════════════════════════════
// Overview tab
// ════════════════════════════════════════════════════════════════════════

function Overview({ origin }: { origin: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bienvenue dans le guide d&apos;intégrations</CardTitle>
          <CardDescription>
            Ce guide t&apos;accompagne étape par étape pour connecter chaque réseau social à Bloom. Une fois connecté, Bloom récupère automatiquement les stats de tes posts (vues, likes, commentaires, dépenses pub).
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Pre-requisites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prérequis communs</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3 text-muted-foreground">
          <div>
            <strong className="text-foreground">1. Migration SQL exécutée sur Supabase</strong>
            <p className="mt-1">Va sur <ExtLink href="https://supabase.com/dashboard">supabase.com/dashboard</ExtLink> → ton projet → <strong>SQL Editor</strong> → <strong>New query</strong>.</p>
            <p className="mt-1">Copie-colle le contenu du fichier <code className="bg-muted px-1 rounded">supabase/migrations/20260515_social_oauth.sql</code> et clique <strong>Run</strong>.</p>
          </div>
          <div>
            <strong className="text-foreground">2. Connais ton URL de production</strong>
            <CodeBlock value={origin} label="Ton domaine actuel" />
            <p className="text-xs">Remplace ce domaine dans chaque tutoriel quand on parle de redirect URI.</p>
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quelle plateforme commencer ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Plateforme</th>
                  <th className="py-2 font-medium">Difficulté</th>
                  <th className="py-2 font-medium">Setup</th>
                  <th className="py-2 font-medium">Délai review</th>
                </tr>
              </thead>
              <tbody>
                {PLATFORMS.filter((p) => p.id !== 'overview').map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{p.label}</td>
                    <td className="py-2">
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        p.difficulty === 'Facile' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                        p.difficulty === 'Moyen' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      )}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{p.time}</td>
                    <td className="py-2 text-muted-foreground">{p.reviewTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Info>
            <strong>Recommandation :</strong> commence par <strong>YouTube</strong> — pas de review, pas d&apos;approbation, ça marche en 10 minutes. Ça te confirme aussi que ton setup Vercel + Supabase fonctionne avant d&apos;attendre les autres.
          </Info>
        </CardContent>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// YouTube guide
// ════════════════════════════════════════════════════════════════════════

function YouTubeGuide({ origin }: { origin: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">YouTube + Google Calendar</CardTitle>
          <CardDescription>Le plus simple — pas de review. ~10 minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Info>
            Les credentials Google sont partagés entre <strong>YouTube</strong> et <strong>Google Calendar</strong>. Tu fais ce setup une seule fois et les deux fonctionnent.
          </Info>
        </CardContent>
      </Card>

      <div>
        <Step num={1} title="Créer un projet Google Cloud">
          <p>Va sur <ExtLink href="https://console.cloud.google.com/">console.cloud.google.com</ExtLink></p>
          <p>En haut, clique sur le sélecteur de projet → <strong>« Nouveau projet »</strong></p>
          <p>Nom : <code className="bg-muted px-1 rounded">Bloom</code> → <strong>Créer</strong></p>
          <p>Sélectionne le projet une fois créé (dans la barre du haut)</p>
        </Step>

        <Step num={2} title="Activer les APIs">
          <p>Menu burger (☰) → <strong>APIs &amp; Services</strong> → <strong>Bibliothèque</strong></p>
          <p>Cherche et active chacune de ces APIs (clique → bouton <strong>« Activer »</strong>) :</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><code className="bg-muted px-1 rounded">Google Calendar API</code></li>
            <li><code className="bg-muted px-1 rounded">YouTube Data API v3</code></li>
            <li><code className="bg-muted px-1 rounded">YouTube Analytics API</code></li>
          </ul>
        </Step>

        <Step num={3} title="Écran de consentement OAuth">
          <p>Menu → <strong>APIs &amp; Services</strong> → <strong>OAuth consent screen</strong></p>
          <p>User Type : <strong>External</strong> → <strong>Create</strong></p>
          <p>App information :</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>App name : <code className="bg-muted px-1 rounded">Bloom</code></li>
            <li>User support email : ton email</li>
            <li>Developer contact : ton email</li>
          </ul>
          <p><strong>Save and continue</strong> jusqu&apos;à la fin (scopes, test users).</p>
          <Warning>
            Pendant le développement, ton app est en mode <strong>Testing</strong>. Ajoute ton propre email dans <strong>« Test users »</strong> sinon tu ne pourras pas te connecter.
          </Warning>
        </Step>

        <Step num={4} title="Créer les credentials">
          <p>Menu → <strong>APIs &amp; Services</strong> → <strong>Credentials</strong></p>
          <p><strong>+ CREATE CREDENTIALS</strong> → <strong>OAuth client ID</strong></p>
          <p>Application type : <strong>Web application</strong></p>
          <p>Name : <code className="bg-muted px-1 rounded">Bloom</code></p>
          <p><strong>Authorized redirect URIs</strong> — clique <strong>« + ADD URI »</strong> et colle chacune de ces URLs :</p>
          <CodeBlock value={`${origin}/api/auth/google/callback`} label="Callback Google Calendar" />
          <CodeBlock value={`${origin}/api/auth/youtube/callback`} label="Callback YouTube" />
          <CodeBlock value="http://localhost:3000/api/auth/google/callback" label="Localhost (dev)" />
          <CodeBlock value="http://localhost:3000/api/auth/youtube/callback" label="Localhost (dev)" />
          <p><strong>CREATE</strong> → une popup affiche <strong>Client ID</strong> et <strong>Client secret</strong>. Copie-les.</p>
        </Step>

        <Step num={5} title="Mettre les variables dans Vercel">
          <p>Va sur <ExtLink href="https://vercel.com/dashboard">vercel.com/dashboard</ExtLink> → ton projet Bloom → <strong>Settings</strong> → <strong>Environment Variables</strong></p>
          <p>Ajoute :</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><code className="bg-muted px-1 rounded">GOOGLE_OAUTH_CLIENT_ID</code> = (le Client ID copié)</li>
            <li><code className="bg-muted px-1 rounded">GOOGLE_OAUTH_CLIENT_SECRET</code> = (le Client secret copié)</li>
          </ul>
          <p><strong>Redéploie</strong> : Deployments → trois points sur le dernier → <strong>Redeploy</strong></p>
        </Step>

        <Step num={6} title="Connecter dans Bloom">
          <p>Ouvre Bloom → <strong>Paramètres</strong> → <strong>Intégrations</strong> → section <strong>Réseaux sociaux</strong></p>
          <p>Sur <strong>YouTube</strong> → clique <strong>Connecter YouTube</strong></p>
          <p>Choisis ton compte Google → <strong>Continuer</strong> → accepte les permissions</p>
          <p>Tu reviens dans Bloom avec le statut <strong>Connecté</strong> ✓</p>
        </Step>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pièges fréquents</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p><strong>« Erreur 400 redirect_uri_mismatch »</strong> → l&apos;URL dans Google Cloud ne correspond pas exactement. Ajoute http ET https, avec/sans slash final.</p>
          <p><strong>« Access blocked: Bloom has not completed verification »</strong> → ajoute ton email dans Test Users.</p>
          <p><strong>Pour passer en Production</strong> (utilisateurs externes) → soumettre l&apos;app à Google (formulaire de vérification, peut prendre 4-6 semaines).</p>
        </CardContent>
      </Card>
    </div>
  )
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/integrations-guide/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      if (res.ok) {
        sessionStorage.setItem(SESSION_KEY, '1')
        onUnlock()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error === 'Code not configured on server'
          ? 'Le code n\'est pas configuré côté serveur (variable INTEGRATIONS_GUIDE_CODE).'
          : 'Code incorrect.')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="7" width="10" height="7" rx="2" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Guide des intégrations</h1>
              <p className="text-xs text-muted-foreground">Accès restreint</p>
            </div>
          </div>
        </div>
        <div className="h-px gradient-line" />
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Page protégée</CardTitle>
            <CardDescription>
              Cette page contient des informations techniques d&apos;administration.
              Entre le code d&apos;accès pour la consulter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="password"
                placeholder="Code d'accès"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <Button type="submit" disabled={busy || !code.trim()} className="w-full">
                {busy ? 'Vérification...' : 'Déverrouiller'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LinkedInGuide({ origin }: { origin: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LinkedIn</CardTitle>
          <CardDescription>Le plus strict pour la review. Marketing Developer Platform = très long.</CardDescription>
        </CardHeader>
      </Card>

      <div>
        <Step num={1} title="Page LinkedIn pour ton business">
          <p>LinkedIn → icône Work (en haut) → <strong>Créer une page</strong> → page de société</p>
          <p>Tu as besoin d&apos;une page d&apos;entreprise pour l&apos;associer à l&apos;app.</p>
        </Step>

        <Step num={2} title="Créer l'App">
          <p>Va sur <ExtLink href="https://www.linkedin.com/developers/apps">linkedin.com/developers/apps</ExtLink></p>
          <p><strong>Create app</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>App name : <code className="bg-muted px-1 rounded">Bloom</code></li>
            <li>LinkedIn Page : la page que tu viens de créer</li>
            <li>App logo : upload un PNG carré (200×200 min)</li>
            <li>Legal agreement : coche</li>
          </ul>
          <p><strong>Create app</strong></p>
        </Step>

        <Step num={3} title="Configuration Auth">
          <p>Onglet <strong>Auth</strong> de l&apos;app :</p>
          <p><strong>Authorized redirect URLs</strong> :</p>
          <CodeBlock value={`${origin}/api/auth/linkedin/callback`} label="Callback prod" />
          <CodeBlock value="http://localhost:3000/api/auth/linkedin/callback" label="Localhost (dev)" />
        </Step>

        <Step num={4} title="Products & permissions">
          <p>Onglet <strong>Products</strong> → demande accès à :</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>Sign In with LinkedIn using OpenID Connect</strong> (approuvé immédiatement)</li>
            <li><strong>Share on LinkedIn</strong> (approuvé immédiatement)</li>
            <li><strong>Marketing Developer Platform</strong> (review 2-4 semaines, requis pour <code className="bg-muted px-1 rounded">r_ads</code>, <code className="bg-muted px-1 rounded">rw_organization_admin</code>)</li>
            <li><strong>Advertising API</strong> (review, pour récupérer ad spend)</li>
          </ul>
          <Warning>
            Sans Marketing Developer Platform : seuls les scopes basiques marchent (profil + post sur ton profil), pas d&apos;accès aux organisations ni aux ads.
          </Warning>
        </Step>

        <Step num={5} title="Credentials">
          <p>Onglet <strong>Auth</strong> :</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><strong>Client ID</strong> → <code className="bg-muted px-1 rounded">LINKEDIN_CLIENT_ID</code></li>
            <li><strong>Client Secret</strong> → <code className="bg-muted px-1 rounded">LINKEDIN_CLIENT_SECRET</code></li>
          </ul>
        </Step>

        <Step num={6} title="Variables Vercel + Connecter">
          <p>Vercel → Settings → Environment Variables → ajoute les deux variables → redéploie</p>
          <p>Bloom → Paramètres → <strong>LinkedIn</strong> → <strong>Connecter LinkedIn</strong></p>
        </Step>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pièges fréquents</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p><strong>« ACCESS_DENIED »</strong> → le produit n&apos;est pas approuvé pour le scope demandé. Vérifie l&apos;onglet Products.</p>
          <p><strong>Pas d&apos;organisation visible</strong> → tu as besoin de <code className="bg-muted px-1 rounded">r_organization_admin</code> (Marketing Developer Platform).</p>
        </CardContent>
      </Card>
    </div>
  )
}
