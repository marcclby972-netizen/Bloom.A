export function requestNotificationPermission() {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function sendNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '/favicon.ico' })
}

export function playAlertSound() {
  if (typeof window === 'undefined') return
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  oscillator.frequency.setValueAtTime(800, ctx.currentTime)
  oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
  oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2)

  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.5)
}
