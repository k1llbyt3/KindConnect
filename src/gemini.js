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

// ─── IMPACT PREDICTION ─────────────────────────────────────

export async function predictImpact(report) {
  const prompt = `Predict what will happen in 24-48 hours if no action is taken.
Issue Type: ${report.issueType}
Description: ${report.description}
Location: ${report.location}
Affected: ${report.affectedCount}
Severity: ${report.severityRaw}/5

Output JSON only:
{
  "predictedImpact": "<short description of impact>",
  "riskLevel": "<Low|Medium|High|Severe>"
}`;

  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let clean = rawText.replace(/```json|```/gi, '').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) clean = jsonMatch[0];
        try {
          const parsed = JSON.parse(clean);
          if (parsed.predictedImpact && parsed.riskLevel) {
            return parsed;
          }
        } catch (parseErr) {
          console.warn("Impact Prediction JSON parse failed:", parseErr, "Raw Text:", clean);
        }
      }
    }
  } catch (err) {
    console.warn("Impact Prediction failed:", err);
  }
  
  // Fallback
  return {
    predictedImpact: "If left unresolved, this situation may worsen over the next 24-48 hours, potentially affecting more people in the area.",
    riskLevel: "Medium"
  };
}

// ─── USP 1: AUTO IMPACT STATEMENT GENERATOR ──────────────────

export const generateImpactStatement = async (task) => {
  if (task.impactStatement) return task.impactStatement

  const prompt = `You are writing a one-sentence impact report for an NGO donor report.

Task completed:
- Volunteer: ${task.volunteerName}
- Issue type: ${task.issueType}
- Location: ${task.reportLocation}
- Urgency: ${task.urgencyLevel}
- People affected: ${task.affectedCount || 'several'}
- Completion note: ${task.completionNote || 'Task completed successfully'}
- Time from report to completion: ${task.hoursToComplete || 'within the day'}

Write ONE sentence (max 40 words) that reads like a real impact report entry.
Format: "On [date], volunteer [name] [action verb] [what happened] in [location], [outcome for community]."
Return only the sentence. No quotes, no extra text.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 80 }
      })
    })
    clearTimeout(timeout)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text || null
  } catch (e) {
    clearTimeout(timeout)
    return `On ${new Date().toLocaleDateString()}, volunteer ${task.volunteerName} responded to a ${task.urgencyLevel?.toLowerCase() || ''} ${task.issueType} issue in ${task.reportLocation}, completing the assigned task successfully.`
  }
}

// ─── USP 2: REPORT CLUSTERING & CRISIS ESCALATION ────────────

export const detectReportCluster = async (newReport, existingReports) => {
  if (existingReports.length < 3) return null

  const recent = existingReports
    .filter(r => r.status === 'open' && r.id !== newReport.id)
    .slice(0, 8)

  if (recent.length === 0) return null

  const existingJson = JSON.stringify(recent.map(r => ({
    id: r.id,
    issueType: r.issueType,
    location: r.location,
    summary: r.aiSummary || r.description?.slice(0, 100),
    affectedCount: r.affectedCount
  })))

  const prompt = `You are analyzing NGO field reports to detect duplicate crisis reports.

New report:
- Type: ${newReport.issueType}
- Location: ${newReport.location}
- Summary: ${newReport.aiSummary || newReport.description?.slice(0, 150)}
- Affected: ${newReport.affectedCount}

Existing open reports:
${existingJson}

Are any existing reports describing the SAME underlying crisis as the new report?
Same crisis = same issue type, same approximate location, same root cause.

Return ONLY this JSON:
{
  "clusterFound": true | false,
  "matchedReportIds": ["id1", "id2"],
  "clusterReason": "one sentence explaining why these are the same crisis",
  "combinedAffectedCount": <sum of affected counts of matched reports + new report>
}

If no cluster found: { "clusterFound": false, "matchedReportIds": [], "clusterReason": "", "combinedAffectedCount": 0 }`

  const parsed = await callGemini(prompt)
  if (!parsed || !parsed.clusterFound) return null

  return {
    matchedReportIds: parsed.matchedReportIds || [],
    clusterReason: parsed.clusterReason,
    combinedAffectedCount: Number(parsed.combinedAffectedCount) || newReport.affectedCount
  }
}

// ─── USP 3: VOLUNTEER BURNOUT & FATIGUE DETECTION ────────────

export const checkVolunteerWellbeing = async (volunteer, recentTasks, updateVolunteerFunc) => {
  if (!recentTasks || recentTasks.length < 2) {
    return { wellbeingStatus: 'Green', reason: 'Insufficient task history — assumed available.' }
  }

  if (volunteer.wellbeingCheckedAt) {
    const checkedAt = volunteer.wellbeingCheckedAt.toDate?.() || new Date(volunteer.wellbeingCheckedAt)
    const hoursSince = (Date.now() - checkedAt) / (1000 * 60 * 60)
    if (hoursSince < 6 && volunteer.wellbeingStatus) {
      return { wellbeingStatus: volunteer.wellbeingStatus, reason: volunteer.wellbeingReason }
    }
  }

  const taskSummary = recentTasks.slice(0, 5).map(t => ({
    issueType: t.issueType,
    urgencyLevel: t.urgencyLevel,
    completedAt: t.completedAt || 'unknown',
    note: t.completionNote?.slice(0, 80) || 'none'
  }))

  const prompt = `You are a volunteer welfare coordinator for an NGO.

Volunteer: ${volunteer.name}
Recent completed tasks (last 5):
${JSON.stringify(taskSummary)}

Assess this volunteer's current workload and potential fatigue.

Return ONLY this JSON:
{
  "wellbeingStatus": "Green" | "Yellow" | "Red",
  "reason": "<one sentence explanation for the admin>"
}

Green = volunteer is fine, can take more tasks
Yellow = showing signs of heavy load, assign with caution
Red = overworked or handling repeated high-stress tasks, recommend rest`

  const parsed = await callGemini(prompt)

  if (!parsed) {
    return { wellbeingStatus: 'Green', reason: 'Unable to assess — assuming available.' }
  }

  const validStatuses = ['Green', 'Yellow', 'Red']
  const status = validStatuses.includes(parsed.wellbeingStatus) ? parsed.wellbeingStatus : 'Green'

  if (updateVolunteerFunc) {
    await updateVolunteerFunc(volunteer.id, {
      wellbeingStatus: status,
      wellbeingReason: parsed.reason,
      wellbeingCheckedAt: new Date()
    })
  }

  return { wellbeingStatus: status, reason: parsed.reason }
}

// ─── USP 4: SMART VOLUNTEER TASK BRIEF ───────────────────────

export const generateTaskBrief = async (task, volunteer) => {
  if (task.taskBrief) return task.taskBrief

  const prompt = `You are briefing a volunteer for an NGO emergency task. Write a clear, action-oriented task brief in plain language. No jargon. Max 60 words.

Task:
- Issue: ${task.issueType}
- Summary: ${task.reportSummary || task.aiSummary || task.description?.slice(0,100)}
- Location: ${task.reportLocation || task.location}
- Urgency: ${task.urgencyLevel}
- People affected: ${task.affectedCount || 'several'}

Volunteer skills: ${volunteer.skills?.join(', ')}

Write a brief that:
1. Tells them exactly what to do first
2. Mentions their specific skill relevance
3. States the urgency clearly
4. Ends with one practical tip

Return only the brief text. No headers, no bullets, just plain paragraph.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 120 }
      })
    })
    clearTimeout(timeout)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text || null
  } catch (e) {
    clearTimeout(timeout)
    return `You have been assigned a ${task.urgencyLevel?.toLowerCase() || 'medium'} priority ${task.issueType} task in ${task.reportLocation || task.location}. Please proceed to the location as soon as possible and update your task status when you arrive.`
  }
}

// ─── USP 5: WEEKLY CRISIS INSIGHT SUMMARY ────────────────────

export const generateWeeklyInsight = async (reports, tasks) => {
  const completedTasks = tasks.filter(t => t.status === 'completed')
  if (completedTasks.length < 3) {
    return null 
  }

  const issueCounts = reports.reduce((acc, r) => {
    acc[r.issueType] = (acc[r.issueType] || 0) + 1
    return acc
  }, {})

  const urgencyCounts = reports.reduce((acc, r) => {
    if (r.urgencyLevel) acc[r.urgencyLevel] = (acc[r.urgencyLevel] || 0) + 1
    return acc
  }, {})

  const avgResponseHrs = completedTasks
    .filter(t => t.hoursToComplete)
    .reduce((sum, t, _, arr) => sum + t.hoursToComplete / arr.length, 0)
    .toFixed(1)

  const totalAffected = reports.reduce((sum, r) => sum + (r.affectedCount || 0), 0)

  const locationCounts = reports.reduce((acc, r) => {
    const loc = r.location?.split(',')[0] || 'Unknown'
    acc[loc] = (acc[loc] || 0) + 1
    return acc
  }, {})
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([loc, count]) => `${loc} (${count} reports)`)
    .join(', ')

  const prompt = `You are a strategic advisor for an NGO. Analyze this week's field data and generate a concise insight report.

This week's data:
- Total reports: ${reports.length}
- Total people affected: ${totalAffected}
- Issue breakdown: ${JSON.stringify(issueCounts)}
- Urgency breakdown: ${JSON.stringify(urgencyCounts)}
- Tasks completed: ${completedTasks.length}
- Average response time: ${avgResponseHrs} hours
- Most affected areas: ${topLocations}

Return ONLY this JSON:
{
  "headline": "<one powerful sentence summarizing the week>",
  "topCrisisType": "<the most common or severe issue type>",
  "hotspotArea": "<most reported location>",
  "responseEfficiency": "<brief assessment of response time performance>",
  "keyInsight": "<one non-obvious insight from the data>",
  "recommendation": "<one specific, actionable recommendation for next week>"
}`

  const parsed = await callGemini(prompt)
  if (!parsed) return null

  return {
    headline:            parsed.headline || 'Weekly summary generated.',
    topCrisisType:       parsed.topCrisisType || 'Mixed',
    hotspotArea:         parsed.hotspotArea || 'Various',
    responseEfficiency:  parsed.responseEfficiency || 'Data insufficient',
    keyInsight:          parsed.keyInsight || 'Continue monitoring trends.',
    recommendation:      parsed.recommendation || 'Maintain current volunteer allocation.',
    generatedAt:         new Date().toISOString(),
    dataPoints: {
      totalReports: reports.length,
      totalAffected,
      completedTasks: completedTasks.length,
      avgResponseHrs: Number(avgResponseHrs) || 0
    }
  }
}
