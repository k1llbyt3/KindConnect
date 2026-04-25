export const ISSUE_TYPES = [
  'water', 'food', 'medical', 'shelter', 'safety', 'infrastructure', 'other'
]

export const SKILL_OPTIONS = [
  'medical', 'construction', 'counseling', 'logistics',
  'teaching', 'driving', 'admin', 'translation', 'tech', 'general'
]

export const TASK_STATUSES = ['assigned', 'accepted', 'in_progress', 'completed']

export const URGENCY_LEVELS = { Critical: 80, High: 60, Medium: 40, Low: 0 }

export const URGENCY_COLORS = {
  Critical: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  High:     { bg: '#fff7ed', text: '#ea580c', border: '#fdba74' },
  Medium:   { bg: '#fefce8', text: '#ca8a04', border: '#fde047' },
  Low:      { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  Pending:  { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' },
}

export const SKILL_TO_ISSUE_MAP = {
  water:          ['construction', 'tech', 'general'],
  food:           ['logistics', 'general'],
  medical:        ['medical', 'counseling'],
  shelter:        ['construction', 'general'],
  safety:         ['counseling', 'general'],
  infrastructure: ['construction', 'tech'],
  other:          ['general'],
}
