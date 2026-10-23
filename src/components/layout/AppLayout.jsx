import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Icon from '../Icons'
import { Brand, DemoBanner } from '../common'

const studentNav = [['Dashboard', '/student', 'home'], ['Calendar', '/student/calendar', 'calendar'], ['Examinations', '/student/examinations', 'clock'], ['Academics', '/student/academics', 'chart'], ['Grade Calculator', '/student/calculator', 'chart'], ['Documents', '/student/documents', 'file'], ['Fees', '/student/fees', 'wallet'], ['Announcements', '/student/announcements', 'bell'], ['Messages', '/student/messages', 'mail'], ['Profile', '/student/profile', 'user']]
const roleNav = { admin: [['Overview', '/admin', 'home'], ['Academic calendar', '/admin/calendar', 'calendar'], ['Announcements', '/admin/announcements', 'bell'], ['Fees', '/admin/fees', 'wallet'], ['Departments', '/admin/departments', 'users'], ['Users', '/admin/students', 'users'], ['Messages', '/admin/messages', 'mail']], teacher: [['Calendar', '/teacher', 'calendar'], ['Announcements', '/teacher/announcements', 'bell'], ['Classes', '/teacher/classes', 'users'], ['Marks', '/teacher/marks', 'chart'], ['Messages', '/teacher/messages', 'mail']] }
export default function AppLayout({ children }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const navigate = useNavigate()
  const items = user?.role === 'student' ? studentNav : roleNav[user?.role] || studentNav
  const goLogout = () => { logout(); navigate('/') }
  return <div className="portal-shell"><aside className={`sidebar ${open ? 'is-open' : ''}`}><Brand light/><p className="role-pill">{`${user?.role} workspace`}</p><nav aria-label="Portal navigation">{items.map(([label, to, icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon name={icon}/>{label}</NavLink>)}</nav><button className="sidebar-logout" onClick={goLogout}><Icon name="logout"/> Sign out</button></aside>{open && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)}/>}<main className="portal-main"><header className="portal-header"><button className="icon-button mobile-only" aria-label="Open navigation" onClick={() => setOpen(true)}><Icon name="menu"/></button><div><strong>CampusOne</strong><span> / GNDU Student Hub</span></div><button className="user-chip" onClick={() => navigate(user?.role === 'student' ? '/student/profile' : '/')}><span>{user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><small>{user?.name}</small></button></header><DemoBanner/>{children}</main></div>
}
