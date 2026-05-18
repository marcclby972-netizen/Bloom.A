'use client'

/**
 * Section wrapper + form atoms partagés par toutes les sections settings.
 * Cohérent avec dashboard.css tokens (var(--bloom-text), --bloom-surface, etc.).
 */

import { useId } from 'react'

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      style={{
        background: 'var(--bloom-surface)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 18,
        padding: 24,
        marginBottom: 18,
        scrollMarginTop: 100,
      }}
    >
      <header style={{ marginBottom: 18 }}>
        {eyebrow && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--bloom-text-faint)',
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 13.5,
              color: 'var(--bloom-text-muted)',
              marginTop: 6,
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--bloom-text)',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--bloom-text-faint)',
            marginTop: 4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: 'var(--bloom-surface-2)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 12,
        color: 'var(--bloom-text)',
        padding: '10px 14px',
        fontSize: 14,
        fontFamily: 'inherit',
        outline: 'none',
        ...props.style,
      }}
    />
  )
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        background: 'var(--bloom-surface-2)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 12,
        color: 'var(--bloom-text)',
        padding: '10px 14px',
        fontSize: 14,
        fontFamily: 'inherit',
        outline: 'none',
        resize: 'vertical',
        minHeight: 80,
        ...props.style,
      }}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        background: 'var(--bloom-surface-2)',
        border: '1px solid var(--bloom-border)',
        borderRadius: 12,
        color: 'var(--bloom-text)',
        padding: '10px 14px',
        fontSize: 14,
        fontFamily: 'inherit',
        outline: 'none',
        cursor: 'pointer',
        ...props.style,
      }}
    />
  )
}

export function Toggle({
  on,
  onChange,
  label,
  description,
  disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0',
        borderBottom: '1px solid var(--bloom-border)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--bloom-text)',
            marginBottom: 2,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {label}
        </label>
        {description && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--bloom-text-muted)',
            }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => onChange(!on)}
        style={{
          flexShrink: 0,
          width: 44,
          height: 26,
          borderRadius: 999,
          border: '1px solid var(--bloom-border-strong)',
          background: on ? 'var(--gradient)' : 'var(--bloom-surface-2)',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 200ms ease, border-color 200ms ease',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 20 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 200ms ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        />
      </button>
    </div>
  )
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="btn btn-primary" type={props.type ?? 'button'} />
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="btn btn-ghost-dark" type={props.type ?? 'button'} />
}

export function FieldError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p
      role="alert"
      style={{
        fontSize: 12.5,
        color: '#FCA5A5',
        marginTop: 8,
      }}
    >
      {error}
    </p>
  )
}

export function FieldSuccess({ success }: { success: string | null }) {
  if (!success) return null
  return (
    <p
      style={{
        fontSize: 12.5,
        color: '#86EFAC',
        marginTop: 8,
      }}
    >
      ✓ {success}
    </p>
  )
}
