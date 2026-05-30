import { useState } from 'react'
import { getClientRevenueForMonth, clientMonthlyRetainer, fmt } from '../utils/calculations'

const TYPE_LABELS = { retainer: 'Retainer', project: 'Project', both: 'Both' }

function fmtMonth(val) {
  if (!val) return <span style={{ color: 'var(--muted2)' }}>—</span>
  const [y, m] = val.split('-')
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const STATUS_ORDER = { confirmed: 0, pending: 1, medium: 2, lost: 3 }

function SortIcon({ active, dir }) {
  if (!active) return <span className="sort-icon sort-icon--idle">↕</span>
  return <span className="sort-icon sort-icon--active">{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function ClientTable({ clients, defaultRate, onEdit, onDelete, onStatusChange, onMoveToExisting }) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  if (clients.length === 0) {
    return <div className="empty-state">No clients match this filter.</div>
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rows = clients.map(client => {
    const monthly = clientMonthlyRetainer(client, defaultRate)
    const annual  = Array.from({ length: 12 }, (_, i) =>
      getClientRevenueForMonth(client, i, defaultRate)
    ).reduce((a, b) => a + b, 0)
    return { client, monthly, annual }
  })

  // Sort
  if (sortKey) {
    rows.sort((a, b) => {
      let av, bv
      switch (sortKey) {
        case 'name':
          av = a.client.name.toLowerCase()
          bv = b.client.name.toLowerCase()
          break
        case 'type':
          av = a.client.type
          bv = b.client.type
          break
        case 'status':
          av = STATUS_ORDER[a.client.status] ?? 99
          bv = STATUS_ORDER[b.client.status] ?? 99
          break
        case 'startDate':
          av = a.client.startDate || ''
          bv = b.client.startDate || ''
          break
        case 'rate':
          av = a.client.hourlyRate || defaultRate
          bv = b.client.hourlyRate || defaultRate
          break
        case 'hours':
          av = a.client.hoursPerMonth || 0
          bv = b.client.hoursPerMonth || 0
          break
        case 'monthly':
          av = a.monthly
          bv = b.monthly
          break
        case 'annual':
          av = a.annual
          bv = b.annual
          break
        default:
          return 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  const totalMonthly = rows.reduce((s, r) => s + r.monthly, 0)
  const totalAnnual  = rows.reduce((s, r) => s + r.annual,  0)

  function Th({ label, sortable = true, colKey, style }) {
    const active = sortKey === colKey
    return (
      <th
        style={{ cursor: sortable ? 'pointer' : 'default', userSelect: 'none', ...style }}
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

  return (
    <div className="table-wrap">
      <table className="client-table">
        <thead>
          <tr>
            <Th label="Client"      colKey="name"      />
            <Th label="Type"        colKey="type"      />
            <Th label="Status"      colKey="status"    />
            <Th label="Est. Start"  colKey="startDate" />
            <Th label="Rate / hr"   colKey="rate"      />
            <Th label="Hrs / mo"    colKey="hours"     />
            <Th label="Monthly"     colKey="monthly"   />
            <Th label="12-Mo Value" colKey="annual"    />
            <Th label="Notes"       sortable={false}   />
            <Th label=""            sortable={false}   />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ client, monthly, annual }) => (
            <tr key={client.id}>
              <td className="client-name">{client.name}</td>
              <td>
                <span className="badge badge--type">{TYPE_LABELS[client.type]}</span>
              </td>
              <td>
                <select
                  className={`status-select status-select--${client.status}`}
                  value={client.status}
                  onChange={e => onStatusChange(client.id, e.target.value)}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="medium">Medium</option>
                  <option value="lost">Lost</option>
                </select>
              </td>
              <td>{fmtMonth(client.startDate)}</td>
              <td>${(client.hourlyRate || defaultRate).toLocaleString()}</td>
              <td>{client.hoursPerMonth || '—'}</td>
              <td>{monthly > 0 ? fmt(monthly) : <span className="muted">one-time</span>}</td>
              <td>{fmt(annual)}</td>
              <td className="notes-cell" title={client.notes || ''}>
                {client.notes
                  ? <span className="notes-text">{client.notes}</span>
                  : <span style={{ color: 'var(--muted2)' }}>—</span>}
              </td>
              <td className="actions">
                {client.status === 'confirmed' && onMoveToExisting && (
                  <button className="btn-ghost btn-move" title="Move to Existing Clients"
                    onClick={() => onMoveToExisting(client.id)}>→ Existing</button>
                )}
                <button className="btn-ghost" onClick={() => onEdit(client)}>Edit</button>
                <button className="btn-ghost btn-danger" onClick={() => onDelete(client.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totals-row">
            <td colSpan={6}>Total</td>
            <td>{fmt(totalMonthly)}</td>
            <td>{fmt(totalAnnual)}</td>
            <td></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
