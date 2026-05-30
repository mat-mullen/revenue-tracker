import { useState } from 'react'

export default function LostReasonModal({ name, existing, onConfirm, onCancel }) {
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
