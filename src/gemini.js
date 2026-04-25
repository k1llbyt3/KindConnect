const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  const models = [
    'gemini-3-flash-preview',       // Primary (Verified Working)
    'gemini-2.5-flash',             // High-RPM Fallback
    'gemini-2.0-flash',             // High-RPM Fallback
    'gemini-flash-latest',          // Stable General Fallback
    'gemini-3.1-flash-lite-preview' // Ultra-lightweight Fallback
  ]

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) 

    try {
      console.log(`🤖 Attempting Gemini with ${model} (Priority ${i + 1}/${models.length})...`)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1, 
            maxOutputTokens: 1000,
            responseMimeType: "application/json"
          },
        }),
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          const clean = rawText.replace(/```json|```/gi, '').trim()
          return JSON.parse(clean)
        }
      } else {
        const errBody = await res.text()
        console.warn(`⚠️ Gemini ${model} failed (HTTP ${res.status}): ${errBody.slice(0, 150)}...`)
      }
    } catch (err) {
      clearTimeout(timeout)
      console.warn(`⚠️ Gemini ${model} error:`, err.name === 'AbortError' ? 'Timeout' : err.message)
    }

    if (i < models.length - 1) {
      console.log(`⏳ Model ${model} failed. Retrying with next priority model in 2s...`)
      await sleep(2000) 
    }
  }

  console.error('❌ All Gemini models failed. Using local fallback.')
  return null
}

// ─── URGENCY SCORING ────────────────────────────────────────

export const scoreUrgency = async (report) => {
  const desc = (report.description || '').slice(0, 800)

  const prompt = `You are an emergency triage assistant for an NGO. Analyze the following community issue report and return a JSON response only. No markdown, no explanation outside the JSON.

Report Details:
- Issue Type: ${report.issueType}
- Description: ${desc}
- Location: ${report.location}
- Self-reported severity: ${report.severityRaw}/5
- Number of people affected: ${report.affectedCount}

Return ONLY this JSON structure:
{
  "urgencyScore": <integer 0-100>,
  "urgencyLevel": "<Critical|High|Medium|Low>",
  "aiSummary": "<one sentence describing the issue clearly>",
  "aiActionCategory": "<specific action needed, e.g. Emergency water supply>",
  "aiReason": "<one sentence explaining why you gave this score>"
}

Scoring guide:
- 80-100 (Critical): Life-threatening, immediate danger, large population affected
- 60-79 (High): Urgent but not immediately life-threatening, significant impact
- 40-59 (Medium): Important but can wait 24-48 hours
- 0-39 (Low): Non-urgent, quality of life issue`

  const parsed = await callGemini(prompt)
  if (!parsed) return null

  const score = Number(parsed.urgencyScore)
  const validLevels = ['Critical', 'High', 'Medium', 'Low']

  if (
    isNaN(score) || score < 0 || score > 100 ||
    !validLevels.includes(parsed.urgencyLevel) ||
    !parsed.aiSummary || typeof parsed.aiSummary !== 'string'
  ) {
    console.warn('Gemini response failed validation:', parsed)
    return null
  }

  return {
    urgencyScore: Math.round(score),
    urgencyLevel: parsed.urgencyLevel,
    aiSummary: parsed.aiSummary,
    aiActionCategory: parsed.aiActionCategory || 'Community response needed',
    aiReason: parsed.aiReason || 'Score based on report details',
  }
}

// ─── VOLUNTEER MATCHING ─────────────────────────────────────

export const matchVolunteers = async (report, volunteers) => {
  const available = volunteers.filter(v => v.available === true)
  if (available.length === 0) return []

  const volunteersJson = JSON.stringify(
    available.map(v => ({
      id: v.id,
      name: v.name,
      skills: v.skills,
      location: v.location,
      reliabilityScore: v.reliabilityScore,
    }))
  )

  const prompt = `You are a volunteer coordinator. Match the best volunteers for this emergency task.

Task:
- Issue: ${report.issueType}
- Description: ${report.aiSummary || report.description?.slice(0, 200)}
- Action needed: ${report.aiActionCategory || 'Community assistance'}
- Location: ${report.location}
- Urgency: ${report.urgencyLevel}

Available volunteers (JSON array):
${volunteersJson}

Return ONLY a JSON array of the top 3 volunteer matches (or fewer if fewer exist), sorted by best match first:
[
  {
    "volunteerId": "<id from input>",
    "volunteerName": "<name from input>",
    "matchScore": <integer 0-100>,
    "matchReason": "<one sentence why this volunteer is a good match>"
  }
]

Consider: skill relevance to the issue type, location proximity, reliabilityScore. Only include available volunteers.`

  const parsed = await callGemini(prompt)

  if (!parsed || !Array.isArray(parsed)) return []

  return parsed
    .filter(m => m.volunteerId && m.volunteerName)
    .slice(0, 3)
    .map(m => ({
      volunteerId: String(m.volunteerId),
      volunteerName: String(m.volunteerName),
      matchScore: Math.min(Math.max(Number(m.matchScore) || 50, 0), 100),
      matchReason: m.matchReason || 'Skill match',
    }))
}

// ─── SIMPLE FALLBACK MATCHING (no Gemini) ───────────────────

export const simpleMatch = (report, volunteers) => {
  const SKILL_TO_ISSUE_MAP = {
    water: ['construction', 'tech', 'general'],
    food: ['logistics', 'general'],
    medical: ['medical', 'counseling'],
    shelter: ['construction', 'general'],
    safety: ['counseling', 'general'],
    infrastructure: ['construction', 'tech'],
    other: ['general'],
  }
  const relevantSkills = SKILL_TO_ISSUE_MAP[report.issueType] || ['general']

  return volunteers
    .filter(v => v.available)
    .map(v => ({
      volunteerId: v.id,
      volunteerName: v.name,
      matchScore: v.skills?.some(s => relevantSkills.includes(s)) ? 70 : 40,
      matchReason: 'Matched by skill category (AI unavailable)',
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
}
