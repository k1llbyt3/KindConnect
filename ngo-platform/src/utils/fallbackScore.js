export const fallbackUrgencyScore = (severityRaw, affectedCount, issueType) => {
  const severityScore = severityRaw * 14; // max 70
  const affectedScore = Math.min(affectedCount / 5, 20); // max 20
  const typeBonus = ['medical', 'water', 'safety'].includes(issueType) ? 10 : 0;
  return Math.round(Math.min(severityScore + affectedScore + typeBonus, 100));
};
