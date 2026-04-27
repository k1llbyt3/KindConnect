const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  const models = [
    'gemini-flash-latest',           // PRIMARY: Stable alias
    'gemini-2.5-flash-lite',         // NEW: Fast and works well
    'gemini-2.0-flash',              // SECONDARY: Good fallback
    'gemini-2.5-flash'               // HEAVY-LIFTING: Reliable
  ]

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) 

    let res = null;
    try {
      console.log(`🤖 Attempting Gemini with ${model} (Priority ${i + 1}/${models.length})...`)
      res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1, // Low temp for reliable JSON
            maxOutputTokens: 800
          },
        }),
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          let clean = rawText.replace(/```json|```/gi, '').trim();
          
          // Robust JSON extraction
          const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (jsonMatch) {
            clean = jsonMatch[0];
          }
          
          // Auto-fix if model forgot array brackets: `{}, {}`
          if (clean.startsWith('{') && clean.endsWith('}') && clean.includes('},')) {
             clean = `[${clean}]`;
          }
          
          try {
            return JSON.parse(clean);
          } catch (e) {
            throw new Error('Invalid JSON format');
          }
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
      if (res && res.status === 429) {
        console.log(`⏳ Quota exceeded (429). Pausing 5.5s...`)
        await new Promise(r => setTimeout(r, 5500))
      } else {
        console.log(`⏳ Model ${model} failed. Retrying with next priority model in 2s...`)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }

  console.error('❌ All Gemini models failed. Using local fallback.')
  return null
}

// ─── URGENCY SCORING ────────────────────────────────────────

export const scoreUrgency = async (report) => {
  const desc = (report.description || '').slice(0, 250)

  const prompt = `NGO Triage. Reply JSON only.
Type:${report.issueType}
Desc:${desc}
Loc:${report.location}
Sev:${report.severityRaw}/5
Pop:${report.affectedCount}

{
  "urgencyScore": <int 0-100>,
  "urgencyLevel": "<Critical|High|Medium|Low>",
  "aiSummary": "<brief issue summary>",
  "aiActionCategory": "<action>",
  "aiReason": "<brief reason>"
}

Critical(80-100): life-threat. High(60-79): urgent. Med(40-59): 24h. Low(0-39): non-urgent.`

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

  const prompt = `Match volunteers to task. JSON array of top 3 ONLY.
Task: ${report.issueType} | ${report.aiActionCategory || 'Help'} | Loc: ${report.location}

Vols:
${volunteersJson}

Output format:
[{"volunteerId":"<id>","volunteerName":"<name>","matchScore":<0-100>,"matchReason":"<brief>"}]`

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
