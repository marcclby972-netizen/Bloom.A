/**
 * Minimal user-agent parser — no external deps.
 * Returns browser, OS, and device type. Good enough for analytics dashboards.
 */

export type ParsedUA = {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  isBot: boolean
}

const BOT_PATTERNS = [
  'bot', 'crawler', 'spider', 'slurp', 'mediapartners', 'feedfetcher',
  'curl', 'wget', 'python-requests', 'httpclient', 'headless',
]

export function parseUserAgent(ua: string): ParsedUA {
  if (!ua) {
    return { browser: 'Inconnu', browserVersion: '', os: 'Inconnu', osVersion: '', deviceType: 'desktop', isBot: false }
  }
  const lower = ua.toLowerCase()

  // Bot detection
  const isBot = BOT_PATTERNS.some((p) => lower.includes(p))

  // Browser detection (order matters — Edge before Chrome, etc.)
  let browser = 'Autre'
  let browserVersion = ''
  if (lower.includes('edg/')) { browser = 'Edge'; browserVersion = match(ua, /Edg\/([\d.]+)/) }
  else if (lower.includes('opr/') || lower.includes('opera')) { browser = 'Opera'; browserVersion = match(ua, /(?:OPR|Opera)\/([\d.]+)/) }
  else if (lower.includes('firefox/')) { browser = 'Firefox'; browserVersion = match(ua, /Firefox\/([\d.]+)/) }
  else if (lower.includes('chrome/') && !lower.includes('chromium')) { browser = 'Chrome'; browserVersion = match(ua, /Chrome\/([\d.]+)/) }
  else if (lower.includes('safari/') && !lower.includes('chrome')) { browser = 'Safari'; browserVersion = match(ua, /Version\/([\d.]+)/) }
  else if (lower.includes('chromium')) { browser = 'Chromium'; browserVersion = match(ua, /Chromium\/([\d.]+)/) }
  else if (lower.includes('msie') || lower.includes('trident')) { browser = 'IE'; browserVersion = match(ua, /(?:MSIE |rv:)([\d.]+)/) }

  // OS detection
  let os = 'Autre'
  let osVersion = ''
  if (lower.includes('windows nt 10')) { os = 'Windows'; osVersion = '10/11' }
  else if (lower.includes('windows nt 6.3')) { os = 'Windows'; osVersion = '8.1' }
  else if (lower.includes('windows nt 6.2')) { os = 'Windows'; osVersion = '8' }
  else if (lower.includes('windows nt 6.1')) { os = 'Windows'; osVersion = '7' }
  else if (lower.includes('windows')) { os = 'Windows'; osVersion = '' }
  else if (lower.includes('iphone') || lower.includes('ipad')) {
    os = 'iOS'
    osVersion = match(ua, /OS ([\d_]+)/).replace(/_/g, '.')
  } else if (lower.includes('mac os x') || lower.includes('macintosh')) {
    os = 'macOS'
    osVersion = match(ua, /Mac OS X ([\d_]+)/).replace(/_/g, '.')
  } else if (lower.includes('android')) {
    os = 'Android'
    osVersion = match(ua, /Android ([\d.]+)/)
  } else if (lower.includes('linux')) {
    os = 'Linux'
  } else if (lower.includes('cros')) {
    os = 'ChromeOS'
  }

  // Device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  if (lower.includes('ipad') || (lower.includes('android') && !lower.includes('mobile'))) {
    deviceType = 'tablet'
  } else if (lower.includes('mobile') || lower.includes('iphone') || lower.includes('android') || lower.includes('phone')) {
    deviceType = 'mobile'
  }

  return { browser, browserVersion, os, osVersion, deviceType, isBot }
}

function match(ua: string, re: RegExp): string {
  const m = ua.match(re)
  return m?.[1] || ''
}
