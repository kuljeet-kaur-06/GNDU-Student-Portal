import { useEffect, useState } from 'react'
import { portalApi } from '../services/portalService'
import { EmptyState, PageHeader } from './common'

export default function TeacherMarks() {
  const [assessments, setAssessments] = useState([])
  const [assessmentId, setAssessmentId] = useState('')
  const [students, setStudents] = useState([])
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const selected = assessments.find((item) => item.id === assessmentId)

  useEffect(() => { portalApi.academics.assessments().then(({ assessments }) => { setAssessments(assessments); setAssessmentId(assessments[0]?.id || '') }).catch((err) => setError(err.message)) }, [])
  useEffect(() => { if (!selected) return; portalApi.courses.students(selected.course.id).then(({ students }) => { setStudents(students); setValues({}) }).catch((err) => setError(err.message)) }, [assessmentId])
  const save = async () => {
    const marks = students.filter((student) => values[student.id] !== '' && values[student.id] !== undefined).map((student) => ({ studentId: student.id, value: Number(values[student.id]) }))
    if (!marks.length) return setError('Enter at least one mark; blank values are left unrecorded.')
    try { await portalApi.academics.saveMarks(assessmentId, marks); setNotice('Marks saved successfully.'); setError('') } catch (err) { setError(err.message) }
  }
  return <div className="page"><PageHeader eyebrow="Faculty" title="Marks entry" description="Only assessments in your assigned courses appear. Blank values are never converted to zero." />{error && <p className="form-error">{error}</p>}{notice && <p className="local-result">{notice}</p>}{!assessments.length ? <EmptyState title="No assessments">Create an assessment from Assigned courses before entering marks.</EmptyState> : <section className="panel"><header><h2>Assessment marks</h2></header><label>Assessment<select value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)}>{assessments.map((item) => <option value={item.id} key={item.id}>{item.course.code} · {item.title}</option>)}</select></label><div className="table-scroll"><table><thead><tr><th>Student</th><th>University ID</th><th>Mark / {selected?.maximumMarks}</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.name}</td><td>{student.universityId || '—'}</td><td><input type="number" min="0" max={selected?.maximumMarks} step="0.1" value={values[student.id] ?? ''} onChange={(event) => setValues({ ...values, [student.id]: event.target.value })} /></td></tr>)}</tbody></table></div><div className="form-actions"><button className="button" onClick={save}>Save entered marks</button></div></section>}</div>
}
