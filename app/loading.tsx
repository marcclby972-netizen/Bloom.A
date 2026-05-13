export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <svg width="20" height="20" viewBox="0 0 20 20" className="animate-spin">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path d="M10 2a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-sm">Chargement...</span>
      </div>
    </div>
  )
}
