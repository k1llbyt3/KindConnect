export const scoreUrgency = async (report) => {
  const { issueType, description, location, severityRaw, affectedCount } = report;
  const truncatedDesc = description ? description.substring(0, 800) : '';

  const prompt = `You are an emergency triage assistant for an NGO. Analyze the following community issue report and return a JSON response only. No markdown, no explanation outside the JSON.

Report Details:
- Issue Type: ${issueType}
- Description: ${truncatedDesc}
- Location: ${location}
- Self-reported severity: ${severityRaw}/5
- Number of people affected: ${affectedCount}

Return ONLY this JSON structure:
{
  "urgencyScore": <integer 0-100>,
  "urgencyLevel": "<Critical|High|Medium|Low>",
  "aiSummary": "<one sentence describing the issue clearly>",
  "aiActionCategory": "<specific action needed>",
  "aiReason": "<one sentence explaining why you gave this score>"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  
  // Strip markdown fences
  const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  
  const parsed = JSON.parse(cleanText);

  if (typeof parsed.urgencyScore !== 'number' || parsed.urgencyScore < 0 || parsed.urgencyScore > 100) {
    throw new Error('Invalid urgencyScore returned from Gemini');
  }

  return parsed;
};

export const matchVolunteers = async (report, volunteers) => {
  const availableVolunteers = volunteers.filter(v => v.available === true);
  
  if (availableVolunteers.length === 0) return [];

  const prompt = `You are a volunteer coordinator. Match the best volunteers for this emergency task.

Task:
- Issue: ${report.issueType}
- Description: ${report.aiSummary}
- Action needed: ${report.aiActionCategory}
- Location: ${report.location}
- Urgency: ${report.urgencyLevel}

Available volunteers (JSON array):
${JSON.stringify(availableVolunteers)}

Return ONLY a JSON array of top 3 volunteer matches (or fewer if fewer exist), sorted by best match first:
[
  {
    "volunteerId": "<id from input>",
    "volunteerName": "<name from input>",
    "matchScore": <integer 0-100>,
    "matchReason": "<one sentence why this volunteer is a good match>"
  }
]

Consider: skill relevance, location proximity if mentioned, availability (must be true). Exclude unavailable volunteers.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (err) {
    console.error('Gemini match failed, using fallback:', err);
    const skillMap = { 
      medical: ['medical'], 
      water: ['construction','tech','general'], 
      food: ['logistics','general'], 
      safety: ['general'], 
      shelter: ['construction','general'] 
    };
    const relevantSkills = skillMap[report.issueType] || ['general'];
    
    return availableVolunteers
      .map(v => ({ 
        volunteerId: v.id, 
        volunteerName: v.name, 
        matchScore: v.skills && v.skills.some(s => relevantSkills.includes(s)) ? 70 : 40, 
        matchReason: 'Matched by skill category' 
      }))
      .sort((a,b) => b.matchScore - a.matchScore)
      .slice(0,3);
  }
};
