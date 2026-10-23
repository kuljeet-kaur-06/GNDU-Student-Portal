// GNDU has not supplied the official component weighting. Keep this module as
// the only place where the provisional grade calculation is defined.
export const gradeCalculationConfig = {
  theoryWeight: 0.7,
  practicalWeight: 0.3,
  precision: 1,
  label: 'Provisional percentage only — GNDU grade thresholds are not configured',
}

const limits = { midsem: 30, endsem: 70, practical: 100 }

export function calculateGrade({ midsem, endsem, practical }) {
  const values = { midsem, endsem, practical }
  for (const [name, maximum] of Object.entries(limits)) {
    const value = values[name]
    if (value !== '' && value !== undefined && value !== null && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > maximum)) {
      return { percentage: null, grade: null, error: `${name[0].toUpperCase()}${name.slice(1)} marks must be between 0 and ${maximum}.` }
    }
  }
  const hasTheory = midsem !== '' || endsem !== ''
  const hasPractical = practical !== ''
  if (!hasTheory && !hasPractical) return { percentage: null, grade: null, error: 'Enter at least one applicable component to calculate a provisional grade.' }
  let percentage
  if (hasTheory && !hasPractical) {
    const earned = (midsem === '' ? 0 : Number(midsem)) + (endsem === '' ? 0 : Number(endsem))
    const available = (midsem === '' ? 0 : limits.midsem) + (endsem === '' ? 0 : limits.endsem)
    percentage = (earned / available) * 100
  } else if (!hasTheory && hasPractical) percentage = Number(practical)
  else {
    const theoryEarned = (midsem === '' ? 0 : Number(midsem)) + (endsem === '' ? 0 : Number(endsem))
    const theoryAvailable = (midsem === '' ? 0 : limits.midsem) + (endsem === '' ? 0 : limits.endsem)
    percentage = ((theoryEarned / theoryAvailable) * 100) * gradeCalculationConfig.theoryWeight + Number(practical) * gradeCalculationConfig.practicalWeight
  }
  return { percentage: Number(percentage.toFixed(gradeCalculationConfig.precision)), grade: null, error: null }
}
