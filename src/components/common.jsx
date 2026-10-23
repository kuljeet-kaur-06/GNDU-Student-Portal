import { useEffect, useRef } from 'react'
import Icon from './Icons'

export function Brand({ light = false, name = 'CampusOne' }) { return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark">G</span><span><strong>{name}</strong><small>GNDU Student Hub</small></span></div> }
export function PageHeader({ eyebrow, title, description, action }) { return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div> }
export function EmptyState({ title = 'Nothing here yet', children }) { return <div className="empty"><Icon name="file" size={26}/><h3>{title}</h3><p>{children}</p></div> }
export function DemoBanner() { return <div className="demo-banner"><Icon name="info" size={17}/> Demo workspace — all academic data is illustrative, not an official university record.</div> }
export function Modal({ title, children, onClose }) { const ref = useRef(); useEffect(() => { ref.current?.focus() }, []); return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex="-1" ref={ref}><button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button><h2 id="dialog-title">{title}</h2>{children}</section></div> }
