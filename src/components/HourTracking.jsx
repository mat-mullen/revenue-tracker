import { useState, useEffect } from 'react'
import { activeClients } from '../data/activeClients'
import ClientDetailModal from './ClientDetailModal'

const STATUS_KEY       = 'arf-tracking-statuses'
const HIDDEN_KEY       = 'arf-hidden-clients'
const LOST_REASONS_KEY = 'arf-lost-reasons'
const DETAILS_KEY      = 'arf-client-details'
const STATUS_ORDER     = { active: 0, inactive: 1, lost: 2 }

function hasDetails(d) {
  if (!d) return false
  return !!(d.primaryContact?.name || d.primaryContact?.email ||
            d.billingContact?.name || d.billingContact?.email ||
            d.documents?.sow || d.documents?.msa)
}

function SortIcon({ active, dir }) {
  if (!active) return <span className="sort-icon sort-icon--idle">↕</span>
  return <span className="sort-icon sort-icon--active">{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function HourTracking({ defaultRate, addedClients = [], onEdit, onDeleteManaged }) {
  const [statuses, setStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}') } catch { return {} }
  })

  const [hidden, setHidden] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')) } catch { return new Set() }
  })

  const [lostReasons, setLostReasons] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOST_REASONS_KEY) || '{}') } catch { return {} }
  })

  const [lostModal, setLostModal] = useState({ open: false, name: '' })

  const [clientDetails, setClientDetails] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}') } catch { return {} }
  })

  const [detailModal, setDetailModal] = useState({ open: false, name: '' })

  const [tab, setTab] = useState('all')

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses))
  }, [statuses])

  useEffect(() => {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]))
  }, [hidden])

  useEffect(() => {
    localStorage.setItem(LOST_REASONS_KEY, JSON.stringify(lostReasons))
  }, [lostReasons])

  useEffect(() => {
    try {
      localStorage.setItem(DETAILS_KEY, JSON.stringify(clientDetails))
    } catch {
      window.alert('Could not save — browser storage is full. Try removing a large document.')
    }
  }, [clientDetails])

  function toggleStatus(name, value) {
    setStatuses(prev => ({ ...prev, [name]: value }))
  }

  // Intercept "lost" selections — show modal instead of immediately updating
  function handleToggle(name, value) {
    if (value === 'lost') {
      setLostModal({ open: true, name })
    } else {
      toggleStatus(name, value)
    }
  }

  function handleLostConfirm({ reason, email }) {
    toggleStatus(lostModal.name, 'lost')
    if (reason || email) {
      setLostReasons(prev => ({ ...prev, [lostModal.name]: { reason, email } }))
    }
    setLostModal({ open: false, name: '' })
  }

  function handleLostCancel() {
    setLostModal({ open: false, name: '' })
  }

  function handleOpenDetail(name) {
    setDetailModal({ open: true, name })
  }

  function handleSaveDetail(details) {
    setClientDetails(prev => ({ ...prev, [detailModal.name]: details }))
    setDetailModal({ open: false, name: '' })
  }

  // Normalise form-added existing clients into the same shape as activeClients
  const normalisedAdded = addedClients.map(c => {
    const isProject = c.type === 'project'
    // Forecast (opportunity) projects store their value in `projectValue` with
    // no hourly breakdown. When such a client is moved to Existing, carry that
    // value over as a fixed amount so revenue isn't lost.
    const fromForecastProject = isProject && !c.hoursPerMonth && c.projectValue
    return {
      _id: c.id,
      name: c.name,
      budgetHours: c.hoursPerMonth || 0,
      budgetType: isProject ? 'project' : 'monthly',
      hourlyRate: c.hourlyRate || defaultRate,
      pricingType: fromForecastProject ? 'fixed' : (c.pricingType || 'hourly'),
      fixedAmount: fromForecastProject ? c.projectValue : (c.fixedAmount || 0),
    }
  })

  // Merge: managed clients override static ones by name; hidden static clients are excluded
  const managedNames = new Set(normalisedAdded.map(c => c.name))
  const mergedClients = [
    ...activeClients.filter(c => !managedNames.has(c.name) && !hidden.has(c.name)),
    ...normalisedAdded,
  ]

  const withStatus = mergedClients.map(c => ({
    ...c,
    status: statuses[c.name] || 'active',
  }))

  const active   = withStatus.filter(c => c.status === 'active')
  const inactive = withStatus.filter(c => c.status === 'inactive')
  const lost     = withStatus.filter(c => c.status === 'lost')

  const activeRetainers = active.filter(c => c.budgetType === 'monthly')
  const allProjects     = withStatus.filter(c => c.budgetType === 'project')
  const activeProjects  = allProjects.filter(c => c.status === 'active')

  const totalMonthlyRevenue = activeRetainers.reduce((s, c) => s + c.budgetHours * (c.hourlyRate || defaultRate), 0)
  const projectValue = c => c.pricingType === 'fixed' ? c.fixedAmount : c.budgetHours * (c.hourlyRate || defaultRate)
  const totalProjectRevenue = activeProjects.reduce((s, c) => s + projectValue(c), 0)

  function handleEdit(c) {
    const formData = c._id
      ? addedClients.find(a => a.id === c._id)
      : {
          name: c.name,
          clientCategory: 'existing',
          type: c.budgetType === 'project' ? 'project' : 'retainer',
          status: 'confirmed',
          hourlyRate: c.hourlyRate || defaultRate,
          hoursPerMonth: c.budgetType === 'monthly' ? c.budgetHours : 0,
          projectValue: 0,
          retainerDuration: 12,
        }
    onEdit(formData)
  }

  function handleDelete(c) {
    if (!window.confirm(`Remove "${c.name}"?`)) return
    if (c._id) {
      onDeleteManaged(c._id)
    } else {
      setHidden(prev => new Set([...prev, c.name]))
    }
  }

  const tableProps = {
    defaultRate,
    onToggle: handleToggle,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onOpenDetail: handleOpenDetail,
    lostReasons,
    clientDetails,
  }

  return (
    <div className="tracking-wrap">
      <div className="tracking-tabs">
        <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
          All <span className="count-badge">{activeRetainers.length + activeProjects.length}</span>
        </button>
        <button className={tab === 'retainers' ? 'active' : ''} onClick={() => setTab('retainers')}>
          Active Retainers <span className="count-badge">{activeRetainers.length}</span>
        </button>
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>
          Active Projects <span className="count-badge">{activeProjects.length}</span>
        </button>
        <button className={tab === 'inactive' ? 'active' : ''} onClick={() => setTab('inactive')}>
          Inactive {inactive.length > 0 && <span className="count-badge">{inactive.length}</span>}
        </button>
        <button className={tab === 'lost' ? 'active' : ''} onClick={() => setTab('lost')}>
          Lost {lost.length > 0 && <span className="count-badge">{lost.length}</span>}
        </button>
      </div>

      {tab === 'all' ? (
        <>
          <div className="tracking-summary tracking-summary--2col">
            <SummaryCard label="Est. Monthly Retainer Revenue" value={'$' + totalMonthlyRevenue.toLocaleString()}
              sub={'$' + (totalMonthlyRevenue * 12).toLocaleString() + ' annually'} accent="green" />
            <SummaryCard label="Estimated Project Revenue" value={'$' + totalProjectRevenue.toLocaleString()}
              sub={activeProjects.length + ' active project' + (activeProjects.length !== 1 ? 's' : '')} accent="brand" />
          </div>
          <div className="section">
            <div className="section-head">
              <h2 className="section-title">Active Retainers <span className="count-badge">{activeRetainers.length}</span></h2>
              <span className="section-note">Using default rate ${defaultRate}/hr</span>
            </div>
            {activeRetainers.length === 0
              ? <div className="empty-state">No active retainers.</div>
              : <RetainerTable clients={activeRetainers} {...tableProps} />}
          </div>
          <div className="section">
            <div className="section-head">
              <h2 className="section-title">Active Projects <span className="count-badge">{activeProjects.length}</span></h2>
              <span className="section-note">Hourly projects use default rate ${defaultRate}/hr</span>
            </div>
            {activeProjects.length === 0
              ? <div className="empty-state">No active projects.</div>
              : <ProjectTable clients={activeProjects} {...tableProps} />}
          </div>
        </>
      ) : tab === 'retainers' ? (
        <>
          <div className="tracking-summary tracking-summary--2col">
            <SummaryCard label="Est. Monthly Revenue" value={'$' + totalMonthlyRevenue.toLocaleString()}
              sub={'$' + (totalMonthlyRevenue * 12).toLocaleString() + ' annually'} accent="green" />
            <SummaryCard label="Active Retainers" value={activeRetainers.length}
              sub={activeRetainers.length + ' clients on monthly retainer'} accent="green" />
          </div>
          <div className="section">
            <div className="section-head">
              <h2 className="section-title">Monthly Retainers <span className="count-badge">{activeRetainers.length}</span></h2>
              <span className="section-note">Using default rate ${defaultRate}/hr</span>
            </div>
            <RetainerTable clients={activeRetainers} {...tableProps} />
          </div>
        </>
      ) : tab === 'projects' ? (
        <>
          <div className="tracking-summary tracking-summary--2col">
            <SummaryCard label="Annual Project Revenue" value={'$' + totalProjectRevenue.toLocaleString()}
              sub={activeProjects.length + ' active project' + (activeProjects.length !== 1 ? 's' : '')} accent="brand" />
            <SummaryCard label="Total Project Hours"
              value={activeProjects.filter(c => c.pricingType !== 'fixed').reduce((s, c) => s + c.budgetHours, 0).toLocaleString() + ' hrs'}
              sub={'Across hourly-billed projects'} accent="brand" />
          </div>
          <div className="section">
            <div className="section-head">
              <h2 className="section-title">Active Projects <span className="count-badge">{activeProjects.length}</span></h2>
              <span className="section-note">Hourly projects use default rate ${defaultRate}/hr</span>
            </div>
            <ProjectTable clients={activeProjects} {...tableProps} />
          </div>
        </>
      ) : tab === 'inactive' ? (
        <div className="section">
          <div className="section-head">
            <h2 className="section-title">Inactive Clients <span className="count-badge">{inactive.length}</span></h2>
          </div>
          {inactive.length === 0
            ? <div className="empty-state">No inactive clients.</div>
            : <RetainerTable clients={inactive} {...tableProps} />}
        </div>
      ) : (
        <div className="section">
          <div className="section-head">
            <h2 className="section-title">Lost Clients <span className="count-badge">{lost.length}</span></h2>
          </div>
          {lost.length === 0
            ? <div className="empty-state">No lost clients.</div>
            : <RetainerTable clients={lost} {...tableProps} />}
        </div>
      )}

      {lostModal.open && (
        <LostReasonModal
          name={lostModal.name}
          existing={lostReasons[lostModal.name]}
          onConfirm={handleLostConfirm}
          onCancel={handleLostCancel}
        />
      )}

      {detailModal.open && (
        <ClientDetailModal
          name={detailModal.name}
          existing={clientDetails[detailModal.name]}
          onSave={handleSaveDetail}
          onClose={() => setDetailModal({ open: false, name: '' })}
        />
      )}
    </div>
  )
}

function LostReasonModal({ name, existing, onConfirm, onCancel }) {
  const [reason, setReason] = useState(existing?.reason || '')
  const [email,  setEmail]  = useState(existing?.email  || '')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Mark as Lost — {name}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="client-form">
          <div className="form-row">
            <label>Why was this client lost?</label>
            <textarea
              className="form-notes"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Budget cuts, went with a competitor, project ended…"
              rows={3}
              autoFocus
            />
          </div>
          <div className="form-row">
            <label>Contact Email (for future outreach)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. jane@clientco.com"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn-danger-solid" onClick={() => onConfirm({ reason, email })}>
              Mark as Lost
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value metric-value--sm">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  )
}

function RetainerTable({ clients, defaultRate, onToggle, onEdit, onDelete, onOpenDetail, lostReasons, clientDetails }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    sortKey === key ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortKey(key), setSortDir('asc'))
  }

  function Th({ label, colKey, sortable = true }) {
    const isActive = sortKey === colKey
    return (
      <th style={{ cursor: sortable ? 'pointer' : 'default', userSelect: 'none' }}
        onClick={sortable ? () => handleSort(colKey) : undefined}
        className={isActive ? 'th--active' : ''}>
        <span className="th-inner">
          {label}{sortable && <SortIcon active={isActive} dir={sortDir} />}
        </span>
      </th>
    )
  }

  const sorted = [...clients].sort((a, b) => {
    if (!sortKey) return 0
    const rate = c => c.hourlyRate || defaultRate
    const vals = {
      name:    [a.name.toLowerCase(), b.name.toLowerCase()],
      status:  [STATUS_ORDER[a.status] ?? 99, STATUS_ORDER[b.status] ?? 99],
      rate:    [rate(a), rate(b)],
      hours:   [a.budgetHours, b.budgetHours],
      monthly: [a.budgetHours * rate(a), b.budgetHours * rate(b)],
      annual:  [a.budgetHours * rate(a) * 12, b.budgetHours * rate(b) * 12],
    }
    const [av, bv] = vals[sortKey] || [0, 0]
    return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0
  })

  const totalMonthly = clients.reduce((s, c) => s + c.budgetHours * (c.hourlyRate || defaultRate), 0)
  const totalAnnual  = totalMonthly * 12

  return (
    <div className="table-wrap">
      <table className="client-table">
        <thead>
          <tr>
            <Th label="Client"      colKey="name"    />
            <Th label="Status"      colKey="status"  />
            <Th label="Rate / HR"   colKey="rate"    />
            <Th label="HRS / MO"    colKey="hours"   />
            <Th label="Monthly"     colKey="monthly" />
            <Th label="12-MO Value" colKey="annual"  />
            <Th sortable={false} label="" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => {
            const rate    = c.hourlyRate || defaultRate
            const monthly = c.budgetHours * rate
            const annual  = monthly * 12
            const info    = lostReasons?.[c.name]
            return (
              <tr key={c.name}>
                <td className="client-name">
                  <button type="button" className="client-name-btn" onClick={() => onOpenDetail(c.name)}>
                    {c.name}
                    {hasDetails(clientDetails?.[c.name]) && <span className="detail-dot" title="Has saved details">●</span>}
                  </button>
                  {info && (
                    <div className="lost-info">
                      {info.reason && <span className="lost-reason">"{info.reason}"</span>}
                      {info.email  && (
                        <a href={`mailto:${info.email}`} className="lost-email" onClick={e => e.stopPropagation()}>
                          ✉ {info.email}
                        </a>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <select className={`status-select status-select--${c.status}`}
                    value={c.status} onChange={e => onToggle(c.name, e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td>${rate.toLocaleString()}</td>
                <td>{c.budgetHours}</td>
                <td>${monthly.toLocaleString()}</td>
                <td>${annual.toLocaleString()}</td>
                <td className="actions">
                  <button className="btn-ghost" onClick={() => onEdit(c)}>Edit</button>
                  <button className="btn-ghost btn-danger" onClick={() => onDelete(c)}>Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td colSpan={4}>Total</td>
            <td>${totalMonthly.toLocaleString()}</td>
            <td>${totalAnnual.toLocaleString()}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ProjectTable({ clients, defaultRate, onToggle, onEdit, onDelete, onOpenDetail, lostReasons, clientDetails }) {
  const clientValue = c => c.pricingType === 'fixed' ? c.fixedAmount : c.budgetHours * (c.hourlyRate || defaultRate)
  const totalValue = clients.reduce((s, c) => s + clientValue(c), 0)
  const totalHours = clients.filter(c => c.pricingType !== 'fixed').reduce((s, c) => s + c.budgetHours, 0)

  return (
    <div className="table-wrap">
      <table className="client-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Status</th>
            <th>Rate / HR</th>
            <th>Budget HRS</th>
            <th>Project Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => {
            const rate    = c.hourlyRate || defaultRate
            const isFixed = c.pricingType === 'fixed'
            const value   = isFixed ? c.fixedAmount : c.budgetHours * rate
            const info    = lostReasons?.[c.name]
            return (
              <tr key={c.name}>
                <td className="client-name">
                  <button type="button" className="client-name-btn" onClick={() => onOpenDetail(c.name)}>
                    {c.name}
                    {hasDetails(clientDetails?.[c.name]) && <span className="detail-dot" title="Has saved details">●</span>}
                  </button>
                  {info && (
                    <div className="lost-info">
                      {info.reason && <span className="lost-reason">"{info.reason}"</span>}
                      {info.email  && (
                        <a href={`mailto:${info.email}`} className="lost-email" onClick={e => e.stopPropagation()}>
                          ✉ {info.email}
                        </a>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <select className={`status-select status-select--${c.status}`}
                    value={c.status} onChange={e => onToggle(c.name, e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td>{isFixed ? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>fixed</span> : `$${rate.toLocaleString()}`}</td>
                <td>{isFixed ? <span style={{ color: 'var(--muted)' }}>—</span> : c.budgetHours}</td>
                <td>${value.toLocaleString()}</td>
                <td className="actions">
                  <button className="btn-ghost" onClick={() => onEdit(c)}>Edit</button>
                  <button className="btn-ghost btn-danger" onClick={() => onDelete(c)}>Delete</button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td colSpan={3}>Total</td>
            <td>{totalHours > 0 ? totalHours + ' hrs' : '—'}</td>
            <td>${totalValue.toLocaleString()}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
