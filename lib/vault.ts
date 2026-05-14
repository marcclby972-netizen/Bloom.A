'use client'

/**
 * Encrypted password vault using WebCrypto AES-GCM.
 * Master password is used to derive a key via PBKDF2.
 * Vault content (entries) is stored encrypted in localStorage.
 * The master password itself is NEVER stored.
 */

const VAULT_KEY = 'bloom_vault_blob'
const VAULT_META_KEY = 'bloom_vault_meta'
const PBKDF2_ITERATIONS = 250_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

export type VaultEntry = {
  id: string
  title: string
  username: string
  password: string
  url: string
  notes: string
  category: string
  createdAt: number
  updatedAt: number
}

export type VaultMeta = {
  initialized: boolean
  saltB64: string
  // Hash of master password for verification (PBKDF2 different salt)
  verifyHashB64: string
  verifySaltB64: string
}

// ── Utilities ──

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function b64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function deriveVerifyHash(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    256
  )
  return bufToB64(bits)
}

// ── Public API ──

export function getVaultMeta(): VaultMeta | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(VAULT_META_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as VaultMeta } catch { return null }
}

export function isVaultInitialized(): boolean {
  return getVaultMeta()?.initialized === true
}

export async function initializeVault(masterPassword: string): Promise<void> {
  if (isVaultInitialized()) throw new Error('Le coffre-fort est déjà initialisé')
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const verifySalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const verifyHash = await deriveVerifyHash(masterPassword, verifySalt)
  const meta: VaultMeta = {
    initialized: true,
    saltB64: bufToB64(salt),
    verifySaltB64: bufToB64(verifySalt),
    verifyHashB64: verifyHash,
  }
  localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta))
  // Store empty vault
  await saveVault([], masterPassword)
}

export async function verifyMasterPassword(masterPassword: string): Promise<boolean> {
  const meta = getVaultMeta()
  if (!meta) return false
  const verifySalt = b64ToBuf(meta.verifySaltB64)
  const hash = await deriveVerifyHash(masterPassword, verifySalt)
  return hash === meta.verifyHashB64
}

export async function loadVault(masterPassword: string): Promise<VaultEntry[]> {
  const meta = getVaultMeta()
  if (!meta) throw new Error('Coffre-fort non initialisé')
  const blob = localStorage.getItem(VAULT_KEY)
  if (!blob) return []
  const data = JSON.parse(blob) as { iv: string; cipher: string }
  const salt = b64ToBuf(meta.saltB64)
  const key = await deriveKey(masterPassword, salt)
  const iv = b64ToBuf(data.iv)
  const cipher = b64ToBuf(data.cipher)
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, cipher as BufferSource)
    const json = new TextDecoder().decode(plain)
    return JSON.parse(json) as VaultEntry[]
  } catch {
    throw new Error('Mot de passe maître incorrect')
  }
}

export async function saveVault(entries: VaultEntry[], masterPassword: string): Promise<void> {
  const meta = getVaultMeta()
  if (!meta) throw new Error('Coffre-fort non initialisé')
  const salt = b64ToBuf(meta.saltB64)
  const key = await deriveKey(masterPassword, salt)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const json = JSON.stringify(entries)
  const plain = new TextEncoder().encode(json)
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plain as BufferSource)
  const data = { iv: bufToB64(iv), cipher: bufToB64(cipher) }
  localStorage.setItem(VAULT_KEY, JSON.stringify(data))
}

export async function changeMasterPassword(oldPassword: string, newPassword: string): Promise<void> {
  const entries = await loadVault(oldPassword) // throws if old wrong
  // Re-init meta with new salt + verify
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const verifySalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const verifyHash = await deriveVerifyHash(newPassword, verifySalt)
  const meta: VaultMeta = {
    initialized: true,
    saltB64: bufToB64(salt),
    verifySaltB64: bufToB64(verifySalt),
    verifyHashB64: verifyHash,
  }
  localStorage.setItem(VAULT_META_KEY, JSON.stringify(meta))
  await saveVault(entries, newPassword)
}

export function destroyVault(): void {
  localStorage.removeItem(VAULT_KEY)
  localStorage.removeItem(VAULT_META_KEY)
}

// ── Password generation ──

const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz'
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

export function generatePassword(opts: {
  length?: number
  upper?: boolean
  digits?: boolean
  symbols?: boolean
} = {}): string {
  const length = opts.length ?? 20
  let pool = ALPHA_LOWER
  if (opts.upper !== false) pool += ALPHA_UPPER
  if (opts.digits !== false) pool += DIGITS
  if (opts.symbols !== false) pool += SYMBOLS
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  let out = ''
  for (let i = 0; i < length; i++) out += pool[arr[i] % pool.length]
  return out
}
