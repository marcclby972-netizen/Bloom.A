/**
 * Helper to publish a post on LinkedIn via the API.
 * Uses the user's stored OAuth token + handles refresh.
 */

import { createClient } from './supabase/server'
import { refreshTokenIfNeeded, type SocialOAuthToken } from './social-oauth'

export type PublishResult = {
  ok: boolean
  postUrn?: string
  error?: string
}

/**
 * Publishes content to LinkedIn as the authenticated user (or org if author URN is provided).
 * Uses the modern /rest/posts endpoint.
 */
export async function publishToLinkedIn(opts: {
  oauthTokenId: string
  content: string
  /** Optional org URN (urn:li:organization:XXX) to publish as. Defaults to personal profile. */
  organizationUrn?: string
}): Promise<PublishResult> {
  const supabase = await createClient()
  const { data: token } = await supabase
    .from('social_oauth_tokens')
    .select('*')
    .eq('id', opts.oauthTokenId)
    .single()
  if (!token) return { ok: false, error: 'Token not found' }
  if (token.platform !== 'linkedin') return { ok: false, error: 'Not a LinkedIn token' }

  let accessToken: string
  try {
    accessToken = await refreshTokenIfNeeded(token as SocialOAuthToken)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Refresh failed' }
  }

  // Determine the author URN
  const meta = (token as SocialOAuthToken).account_metadata as { sub?: string; organizations?: Array<{ urn: string }> }
  const authorUrn = opts.organizationUrn || `urn:li:person:${meta.sub}`
  if (!authorUrn || authorUrn === 'urn:li:person:undefined') {
    return { ok: false, error: 'No author URN — reconnect LinkedIn' }
  }

  try {
    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202405',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: opts.content,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: `LinkedIn API ${res.status}: ${errText.slice(0, 300)}` }
    }

    // LinkedIn returns the URN in x-restli-id header for POST
    const postUrn = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id') || undefined
    return { ok: true, postUrn }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
