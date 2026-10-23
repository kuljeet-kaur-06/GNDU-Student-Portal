import test from 'node:test'
import assert from 'node:assert/strict'
import { assessmentPercentage, attendanceSummary } from '../src/lib/academic.js'

test('attendance summary counts only recorded sessions and avoids division by zero', () => {
  assert.deepEqual(attendanceSummary([]), { totalRecorded: 0, present: 0, absent: 0, percentage: null })
  assert.deepEqual(attendanceSummary([{ status: 'PRESENT' }, { status: 'ABSENT' }, { status: 'LATE' }, { status: 'EXCUSED' }]), { totalRecorded: 4, present: 3, absent: 1, percentage: 75 })
})

test('assessment summary calculates a percentage without inventing an official grade', () => {
  assert.deepEqual(assessmentPercentage([]), { earned: 0, available: 0, percentage: null, grade: null, gradeNote: 'Official GNDU grade thresholds have not been configured.' })
  const summary = assessmentPercentage([{ value: 18, assessment: { maximumMarks: 20 } }, { value: 35, assessment: { maximumMarks: 50 } }])
  assert.equal(summary.earned, 53)
  assert.equal(summary.available, 70)
  assert.equal(summary.percentage, 75.7)
  assert.equal(summary.grade, null)
})
