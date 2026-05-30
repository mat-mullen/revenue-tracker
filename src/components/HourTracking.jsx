import { useState, useEffect } from 'react'
import { activeClients } from '../data/activeClients'

const STATUS_KEY = 'arf-tracking-statuses'
const STATUS_ORDER = { active: 0, inactive: 1, lost: 2 }

function SortIcon({ active, dir }) {
  if (!active) return <span className="sort-icon sort-icon--idle">↕</span>
  return <span className="sort-icon sort-icon--active">{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function HourTracking({ defaultRate, addedClients = [] }) {
  const [statuses, setStatuses] = useState(() => {
    try {
      const s = localStorage.getItem(STATUS_KEY)
      return s ? JSON.parse(s) : {}
    } catch { return {} }
  })

  const [tab, setTab] = useState('active')

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses))
  }, [statuses])

  function toggleStatus(name, value) {
    setStatuses(prev => ({ ...prev, [name]: value }))
  }

  // Normalise form-added existing clients into the same shape as activeClients
  const normalisedAdded = addedClients.map(c => ({
    name: c.name,
    budgetHours: c.hoursPerMonth || 0,
    budgetType: c.type === 'project' ? 'project' : 'monthly',
    hourlyRate: c.hourlyRate || defaultRate,
  }))

  // Merge static seed data with dynamically added clients (deduplicate by name)
  const addedNames = new Set(normalisedAdded.map(c => c.name))
  const mergedClients = [
    ...activeClients.filter(c => !addedNames.has(c.name)),
    ...normalisedAdded,
  ]

  const withStatus = mergedClients.map(c => ({
    ...c,
    status: statuses[c.name] || 'active',
  }))

  const active   = withStatus.filter(c => c.status === 'active')
  const inactive = withStatus.filter(c => c.status === 'inactive')
  const lost     = withStatus.filter(c => c.status === 'lost')

  // Retainers = monthly, Projects = one-time (all statuses)
  const activeRetainers  = active.filter(c => c.budgetType === 'monthly')
  const allProjects      = withStatus.filter(c => c.budgetType === 'project')
  const activeProjects   = allProjects.filter(c => c.status === 'active')

  const totalMonthlyRevenue  = activeRetainers.reduce((s, c) => s + c.budgetHours * (c.hourlyRate || defaultRate), 0)
  const totalProjectRevenue  = activeProjects.reduce((s, c) => s + c.budgetHours * (c.hourlyRate || defaultRate), 0)

  return (
    <div className="tracking-wrap">
      {/* Tab toggle */}
      <div className="tracking-tabs">
        <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
          Active
          <span className="count-badge">{active.length}</span>
        </button>
        <button className={tab === 'inactive' ? 'active' : ''} onClick={() => setTab('inactive')}>
          Inactive
          {inactive.length > 0 && <span className="count-badge">{inactive.length}</span>}
        </button>
        <button className={tab === 'lost' ? 'active' : ''} onClick={() => setTab('lost')}>
          Lost
          {lost.length > 0 && <span className="count-badge">{lost.length}</span>}
        </button>
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>
          Projects
          {allProjects.length > 0 && <span className="count-badge">{allProjects.length}</span>}
        </button>
      </div>

      {tab === 'active' ? (
        <>
          {/* Summary cards */}
          <div className="tracking-summary tracking-summary--3col">
            <SummaryCard
              label="Active Clients"
              value={active.length}
              sub={activeRetainers.length + ' retainers · ' + activeProjects.length + ' projects'}
              accent="green"
            />
            <SummaryCard
              label="Est. Monthly Revenue"
              value={'$' + totalMonthlyRevenue.toLocaleString()}
              sub={'$' + (totalMonthlyRevenue * 12).toLocaleString() + ' annually'}
              accent="green"
            />
            <SummaryCard
              label="Annual Project Revenue"
              value={'$' + totalProjectRevenue.toLocaleString()}
              sub={activeProjects.length + ' active one-time project' + (activeProjects.length !== 1 ? 's' : '')}
              accent="brand"
            />
          </div>

          {/* Monthly retainers table */}
          <div className="section">
            <div className="section-head">
              <h2 className="section-title">
                Monthly Retainers
                <span className="count-badge">{activeRetainers.length}</span>
              </h2>
              <span className="section-note">Using default rate ${defaultRate}/hr</span>
            </div>
            <RetainerTable clients={activeRetainers} defaultRate={defaultRate} onToggle={toggleStatus} />
          </div>
        </>
      ) : tab === 'inactive' ? (
        <div className="section">
          <div className="section-head">
            <h2 className="section-title">
              Inactive Clients <span className="count-badge">{inactive.length}</span>
            </h2>
          </div>
          {inactive.length === 0
            ? <div className="empty-state">No inactive clients.</div>
            : <RetainerTable clients={inactive} defaultRate={defaultRate} onToggle={toggleStatus} />}
        </div>
      ) : tab === 'lost' ? (
        <div className="section">
          <div className="section-head">
            <h2 className="section-title">
              Lost Clients <span className="count-badge">{lost.length}</span>
            </h2>
          </div>
          {lost.length === 0
            ? <div className="empty-state">No lost clients.</div>
            : <RetainerTable clients={lost} defaultRate={defaultRate} onToggle={toggleStatus} />}
        </div>
      ) : (
        /* Projects tab */
        <>
          <div className="tracking-summary tracking-summary--2col">
            <SummaryCard
              label="Annual Project Revenue"
              value={'$' + totalProjectRevenue.toLocaleString()}
              sub={activeProjects.length + ' active · ' + allProjects.filter(c => c.status !== 'active').length + ' inactive / lost'}
              accent="brand"
            />
            <SummaryCard
              label="Total Project Hours"
              value={activeProjects.reduce((s, c) => s + c.budgetHours, 0).toLocaleString() + ' hrs'}
              sub={'Across ' + activeProjects.length + ' active project' + (activeProjects.length !== 1 ? 's' : '')}
              accent="brand"
            />
          </div>

          <div className="section">
            <div className="section-head">
              <h2 className="section-title">
                One-Time Projects
                <span className="count-badge">{allProjects.length}</span>
              </h2>
              <span className="section-note">Using default rate ${defaultRate}/hr</span>
            </div>
            <ProjectTable clients={allProjects} defaultRate={defaultRate} onToggle={toggleStatus} />
          </div>
        </>
      )}
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

function RetainerTable({ clients, defaultRate, onToggle }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function Th({ label, colKey, sortable = true }) {
    const active = sortKey === colKey
    return (
      <th
        style={{ cursor: sortable ? 'pointer' : 'default', userSelect: 'none' }}
        onClick={sortable ? () => handleSort(colKey) : undefined}
        className={active ? 'th--active' : ''}
      >
        <span className="th-inner">
          {label}
          {sortable && <SortIcon active={active} dir={sortDir} />}
        </span>
      </th>
    )
  }

  const sorted = [...clients].sort((a, b) => {
    if (!sortKey) return 0
    let av, bv
    switch (sortKey) {
      case 'name':   av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break
      case 'status': av = STATUS_ORDER[a.status] ?? 99; bv = STATUS_ORDER[b.status] ?? 99; break
      case 'rate':   av = a.hourlyRate || defaultRate; bv = b.hourlyRate || defaultRate; break
      case 'hours':  av = a.budgetHours; bv = b.budgetHours; break
      case 'monthly':av = a.budgetHours * (a.hourlyRate || defaultRate); bv = b.budgetHours * (b.hourlyRate || defaultRate); break
      case 'annual': av = a.budgetHours * (a.hourlyRate || defaultRate) * 12; bv = b.budgetHours * (b.hourlyRate || defaultRate) * 12; break
      default: return 0
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
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
          </tr>
        </thead>
        <tbody>
          {sorted.map(c => {
            const rate    = c.hourlyRate || defaultRate
            const monthly = c.budgetHours * rate
            const annual  = monthly * 12
            return (
              <tr key={c.name}>
                <td className="client-name">{c.name}</td>
                <td>
                  <select
                    className={`status-select status-select--${c.status}`}
                    value={c.status}
                    onChange={e => onToggle(c.name, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td>${rate.toLocaleString()}</td>
                <td>{c.budgetHours}</td>
                <td>${monthly.toLocaleString()}</td>
                <td>${annual.toLocaleString()}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td colSpan={4}>Total</td>
            <td>${totalMonthly.toLocaleString()}</td>
            <td>${totalAnnual.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function ProjectTable({ clients, defaultRate, onToggle }) {
  const totalValue = clients.reduce((s, c) => s + c.budgetHours * (c.hourlyRate || defaultRate), 0)
  const totalHours = clients.reduce((s, c) => s + c.budgetHours, 0)

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
          </tr>
        </thead>
        <tbody>
          {clients.map(c => {
            const rate  = c.hourlyRate || defaultRate
            const value = c.budgetHours * rate
            return (
              <tr key={c.name}>
                <td className="client-name">{c.name}</td>
                <td>
                  <select
                    className={`status-select status-select--${c.status}`}
                    value={c.status}
                    onChange={e => onToggle(c.name, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>
                <td>${rate.toLocaleString()}</td>
                <td>{c.budgetHours}</td>
                <td>${value.toLocaleString()}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td colSpan={3}>Total</td>
            <td>{totalHours}</td>
            <td>${totalValue.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
