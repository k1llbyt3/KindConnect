import { URGENCY_COLORS } from './constants'
import { scoreToLevel } from './fallbackScore'

export const getUrgencyColor = (level) => {
  return URGENCY_COLORS[level] || URGENCY_COLORS.Pending
}

export const getUrgencyLevel = (score) => {
  return scoreToLevel(score)
}

export const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Just now'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
