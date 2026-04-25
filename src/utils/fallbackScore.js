export const fallbackUrgencyScore = (severityRaw, affectedCount, issueType) => {
  const s = Math.min(Math.max(Number(severityRaw) || 1, 1), 5)
  const a = Math.min(Math.max(Number(affectedCount) || 1, 1), 10000)

  const severityScore = s * 14
  const affectedScore = Math.min(a / 5, 20)
  const typeBonus = ['medical', 'water', 'safety'].includes(issueType) ? 10 : 0

  return Math.round(Math.min(severityScore + affectedScore + typeBonus, 100))
}

export const scoreToLevel = (score) => {
  if (score === null || score === undefined) return 'Pending'
  if (score >= 80) return 'Critical'
  if (score >= 60) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}
