/**
 * Helper for social media OAuth token storage and refresh.
 * Used by youtube, meta, tiktok, linkedin integrations.
 */

import { createClient } from './supabase/server'

export type SocialPlatform = 'youtube' | 'meta' | 'tiktok' | 'linkedin'

export type SocialOAuthToken = {
  user_id: string
  platform: SocialPlatform
  access_token: string
  refresh_token: string | null
  expires_at: string | null
  scope: string | null
  account_metadata: Record<string, unknown>
}

/** Save or update a token row */
export async function saveToken(token: Omit<SocialOAuthToken, 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  return supabase.from('social_oauth_tokens').upsert(
    { ...token, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,platform' }
  )
}

/** Get a token for the current user + platform */
export async function getToken(platform: SocialPlatform): Promise<SocialOAuthToken | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('social_oauth_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single()
  return (data as SocialOAuthToken | null)
}

/** Delete a platform connection */
export async function deleteToken(platform: SocialPlatform): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('social_oauth_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('platform', platform)
}

/**
 * Refresh an access token if expired. Returns the live access_token.
 * Each platform's refresh endpoint is slightly different — handled here.
 */
export async function refreshTokenIfNeeded(token: SocialOAuthToken): Promise<string> {
  if (!token.expires_at) return token.access_token
  const expires = new Date(token.expires_at).getTime()
  if (expires - Date.now() > 60_000) return token.access_token
  if (!token.refresh_token) throw new Error('No refresh token — please reconnect')

  let newAccess: string
  let newExpiresIn: number = 3600
  let newRefresh: string | null = token.refresh_token

  if (token.platform === 'youtube') {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) throw new Error('YouTube token refresh failed')
    const data = await res.json() as { access_token: string; expires_in: number }
    newAccess = data.access_token
    newExpiresIn = data.expires_in
  } else if (token.platform === 'meta') {
    // Meta long-lived tokens last 60 days — no refresh endpoint per se,
    // but we can exchange short-lived for long-lived once.
    const res = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${token.access_token}`)
    if (!res.ok) throw new Error('Meta token refresh failed')
    const data = await res.json() as { access_token: string; expires_in?: number }
    newAccess = data.access_token
    newExpiresIn = data.expires_in || 60 * 86400
  } else if (token.platform === 'tiktok') {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) throw new Error('TikTok token refresh failed')
    const data = await res.json() as { access_token: string; expires_in: number; refresh_token: string }
    newAccess = data.access_token
    newExpiresIn = data.expires_in
    newRefresh = data.refresh_token
  } else if (token.platform === 'linkedin') {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    })
    if (!res.ok) throw new Error('LinkedIn token refresh failed')
    const data = await res.json() as { access_token: string; expires_in: number; refresh_token?: string }
    newAccess = data.access_token
    newExpiresIn = data.expires_in
    if (data.refresh_token) newRefresh = data.refresh_token
  } else {
    throw new Error(`Unknown platform: ${token.platform}`)
  }

  const expiresAt = new Date(Date.now() + newExpiresIn * 1000).toISOString()
  const supabase = await createClient()
  await supabase.from('social_oauth_tokens').update({
    access_token: newAccess,
    refresh_token: newRefresh,
    expires_at: expiresAt,
  }).eq('user_id', token.user_id).eq('platform', token.platform)

  return newAccess
}
