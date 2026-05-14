import {
  format,
  formatDistanceToNow,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export {
  addDays, subDays, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isToday, parseISO,
}

export function formatDateFr(date: Date | number | null | undefined, fmt: string = 'dd MMM yyyy'): string {
  if (date === null || date === undefined) return ''
  const d = typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return format(d, fmt, { locale: fr })
}

export function formatRelative(date: Date | number | null | undefined): string {
  if (date === null || date === undefined) return ''
  const d = typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function today(): string {
  return toDateString(new Date())
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Returns { h, m, s } decomposition for rich display */
export function splitTime(seconds: number): { h: number; m: number; s: number } {
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: Math.floor(seconds % 60),
  }
}

export function getHoursArray(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
}

export function getWeekDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfWeek(date, { weekStartsOn })
  const end = endOfWeek(date, { weekStartsOn })
  return eachDayOfInterval({ start, end })
}

export function getMonthDays(date: Date, weekStartsOn: 0 | 1 = 1): Date[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  const monthStart = startOfWeek(start, { weekStartsOn })
  const monthEnd = endOfWeek(end, { weekStartsOn })
  return eachDayOfInterval({ start: monthStart, end: monthEnd })
}

export function getWeekDayLabels(weekStartsOn: 0 | 1 = 1): string[] {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  return weekStartsOn === 1
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : days
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
