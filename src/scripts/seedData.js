import { addVolunteer, addReport, updateReport, db } from '../firebase'
import { scoreUrgency } from '../gemini'
import { fallbackUrgencyScore, scoreToLevel } from '../utils/fallbackScore'
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore'

const clearCollection = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName))
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id))
  }
}

const TEST_VOLUNTEERS = [
  { name: 'Dr. Priya Sharma',  skills: ['medical', 'counseling'],    location: 'Koramangala, Bengaluru',     available: true },
  { name: 'Rahul Verma',       skills: ['construction', 'driving'],   location: 'Whitefield, Bengaluru',      available: true },
  { name: 'Anita Desai',       skills: ['logistics', 'admin'],        location: 'Indiranagar, Bengaluru',     available: true },
  { name: 'Kiran Rao',         skills: ['tech', 'general'],           location: 'Electronic City, Bengaluru', available: true },
  { name: 'Meera Joshi',       skills: ['teaching', 'translation'],   location: 'Jayanagar, Bengaluru',       available: false },
  { name: 'Arjun Patel',       skills: ['search_rescue', 'driving'],  location: 'Marathahalli, Bengaluru',    available: true },
  { name: 'Sneha Reddy',       skills: ['medical', 'general'],        location: 'BTM Layout, Bengaluru',      available: true },
  { name: 'Vikram Singh',      skills: ['security', 'logistics'],     location: 'Hebbal, Bengaluru',          available: true },
  { name: 'Pooja Iyer',        skills: ['counseling', 'admin'],       location: 'Malleshwaram, Bengaluru',    available: true },
]

const TEST_REPORTS = [
  {
    issueType: 'medical',
    description: 'Elderly woman aged 70 collapsed near Devanahalli. Needs immediate medical attention.',
    location: 'Devanahalli, Bengaluru',
    severityRaw: 5,
    affectedCount: 1
  },
  {
    issueType: 'water',
    description: 'Community of 50 families without drinking water for 2 days. Borewell broken.',
    location: 'Anekal, Bengaluru',
    severityRaw: 4,
    affectedCount: 50
  },
  {
    issueType: 'infrastructure',
    description: 'Large pothole near primary school causing traffic issues.',
    location: 'Sarjapur Road, Bengaluru',
    severityRaw: 2,
    affectedCount: 20
  },
  {
    issueType: 'food',
    description: 'Migrant worker camp with 100 people running critically low on rations due to transport strike.',
    location: 'Peenya Industrial Area, Bengaluru',
    severityRaw: 4,
    affectedCount: 100
  },
  {
    issueType: 'safety',
    description: 'Fallen tree blocking the main exit route of a residential layout, creating a fire hazard trap.',
    location: 'HSR Layout Sector 2, Bengaluru',
    severityRaw: 5,
    affectedCount: 200
  },
  {
    issueType: 'shelter',
    description: 'Heavy rains flooded 15 makeshift tents. Families need temporary tarps and dry sleeping areas.',
    location: 'Bellandur lakebed, Bengaluru',
    severityRaw: 4,
    affectedCount: 65
  },
  {
    issueType: 'medical',
    description: 'Minor dengue outbreak suspected. Three kids with high fever need checkups and mosquito nets.',
    location: 'KR Puram, Bengaluru',
    severityRaw: 3,
    affectedCount: 3
  },
]

export const seedAll = async () => {
  console.log('🧹 Clearing old data to prevent duplicates...')
  await clearCollection('reports')
  await clearCollection('volunteers')
  await clearCollection('tasks')
  
  console.log('🌱 START SEEDING...');
  console.log('🌱 Seeding volunteers...')
  for (const v of TEST_VOLUNTEERS) {
    const id = await addVolunteer(v)
    console.log(`  ✓ ${v.name} — id: ${id}`)
  }

  console.log('🌱 Seeding reports + running AI scoring...')
  for (const r of TEST_REPORTS) {
    const reportId = await addReport(r)
    console.log(`  ✓ Report created — id: ${reportId}, calling Gemini...`)

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
    
    console.log(`  ✓ Score obtained: ${aiResult.urgencyLevel}. Updating Firestore...`)
    await updateReport(reportId, { ...aiResult, aiStatus: 'done' })
    console.log(`  ✓ Report updated!`)
  }
  console.log('✅ ALL SEEDING COMPLETE');
}
