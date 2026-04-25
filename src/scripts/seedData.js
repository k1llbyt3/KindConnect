import { addVolunteer, addReport, updateReport } from '../firebase'
import { scoreUrgency } from '../gemini'
import { fallbackUrgencyScore, scoreToLevel } from '../utils/fallbackScore'

const TEST_VOLUNTEERS = [
  { name: 'Dr. Priya Sharma',  skills: ['medical', 'counseling'],    location: 'Koramangala, Bengaluru',     available: true,  phone: null },
  { name: 'Rahul Verma',       skills: ['construction', 'driving'],   location: 'Whitefield, Bengaluru',      available: true,  phone: null },
  { name: 'Anita Desai',       skills: ['logistics', 'admin'],        location: 'Indiranagar, Bengaluru',     available: true,  phone: null },
  { name: 'Kiran Rao',         skills: ['tech', 'general'],           location: 'Electronic City, Bengaluru', available: true,  phone: null },
  { name: 'Meera Joshi',       skills: ['teaching', 'translation'],   location: 'Jayanagar, Bengaluru',       available: false, phone: null },
]

const TEST_REPORTS = [
  {
    submittedBy: 'Test Field Worker',
    issueType: 'medical',
    description: 'Elderly woman aged 70 collapsed near Devanahalli. Unresponsive, no doctor within 20km. Needs immediate evacuation and medical attention.',
    location: 'Devanahalli village outskirts, Bengaluru Rural',
    severityRaw: 5,
    affectedCount: 1,
    photoUrl: null,
  },
  {
    submittedBy: 'Test Field Worker',
    issueType: 'water',
    description: 'Community of 50 families has had no drinking water for 2 days. Children are showing signs of dehydration. Local borewell stopped working.',
    location: 'Anekal taluk, Bengaluru',
    severityRaw: 4,
    affectedCount: 50,
    photoUrl: null,
  },
  {
    submittedBy: 'Test Field Worker',
    issueType: 'infrastructure',
    description: 'Road pothole near the primary school. Vehicles swerve to avoid it. Not dangerous but should be repaired soon.',
    location: 'Sarjapur Road, Bengaluru',
    severityRaw: 2,
    affectedCount: 20,
    photoUrl: null,
  },
]

export const seedAll = async () => {
  console.log('🌱 Seeding volunteers...')
  for (const v of TEST_VOLUNTEERS) {
    const id = await addVolunteer(v)
    console.log(`  ✓ ${v.name} — id: ${id}`)
  }

  console.log('🌱 Seeding reports + running AI scoring...')
  for (const r of TEST_REPORTS) {
    const reportId = await addReport(r)
    console.log(`  ✓ Report created — id: ${reportId}, running AI...`)

    let aiResult = await scoreUrgency(r)

    if (!aiResult) {
      console.warn(`  ⚠ Gemini failed for "${r.issueType}" — using fallback score`)
      const score = fallbackUrgencyScore(r.severityRaw, r.affectedCount, r.issueType)
      aiResult = {
        urgencyScore:     score,
        urgencyLevel:     scoreToLevel(score),
        aiSummary:        r.description.slice(0, 100),
        aiActionCategory: 'Community response needed',
        aiReason:         'Scored using fallback formula (AI unavailable)',
      }
    }

    await updateReport(reportId, { ...aiResult, aiStatus: 'done' })
    console.log(`  ✓ Scored: ${aiResult.urgencyLevel} (${aiResult.urgencyScore}) — ${aiResult.aiSummary}`)
  }

  console.log('✅ Seeding complete. Check Firebase Console.')
}
