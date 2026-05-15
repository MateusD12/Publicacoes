import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const mins = Math.floor(abs / 60000)
  const hours = Math.floor(abs / 3600000)
  const days = Math.floor(abs / 86400000)
  const future = diff > 0
  if (mins < 1) return 'agora'
  if (mins < 60) return `${future ? 'em' : 'há'} ${mins}min`
  if (hours < 24) return `${future ? 'em' : 'há'} ${hours}h`
  return `${future ? 'em' : 'há'} ${days}d`
}

export const PLATFORM_LABEL: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok',
}

export const PLATFORM_COLOR: Record<string, string> = {
  youtube: '#ff0000', instagram: '#e1306c', tiktok: '#00f2ea',
}

export const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', scheduled: 'Agendado', publishing: 'Publicando',
  published: 'Publicado', failed: 'Falhou', pending: 'Pendente',
}

export const STATUS_COLOR: Record<string, string> = {
  draft: '#6b7280', scheduled: '#3b82f6', publishing: '#f59e0b',
  published: '#22c55e', failed: '#ef4444', pending: '#6b7280',
}