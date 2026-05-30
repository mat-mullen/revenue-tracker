import { useState } from 'react'

const EMPTY = {
  name: '',
  clientCategory: 'opportunity',
  type: 'retainer',
  status: 'confirmed',
  startDate: '',
  hourlyRate: '',
  hoursPerMonth: '',
  retainerDuration: 12,
  projectValue: '',
}

export default function ClientForm({ client, defaultRate, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    hourlyRate: defaultRate,
    ...(client || {}),
  }))

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      hourlyRate: Number(form.hourlyRate) || defaultRate,
      hoursPerMonth: Number(form.hoursPerMonth) || 0,
      retainerDuration: Number(form.retainerDuration) || 12,
      projectValue: Number(form.projectValue) || 0,
    })
  }

  const isRetainer = form.type === 'retainer' || form.type === 'both'
  const isProject  = form.type === 'project'  || form.type === 'both'
  const isOpportunity = form.clientCategory === 'opportunity'

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{client ? 'Edit Client' : 'Add Client'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="client-form">

          {/* Category toggle */}
          <div className="form-row">
            <label>Client Category</label>
            <div className="category-toggle">
              <button
                type="button"
                className={form.clientCategory === 'opportunity' ? 'active' : ''}
                onClick={() => set('clientCategory', 'opportunity')}
              >
                Opportunity
              </button>
              <button
                type="button"
                className={form.clientCategory === 'existing' ? 'active' : ''}
                onClick={() => set('clientCategory', 'existing')}
              >
                Existing Client
              </button>
            </div>
            <p className="form-hint">
              {isOpportunity
                ? 'Appears in Biz Dev Forecast'
                : 'Appears in Hour Tracking'}
            </p>
          </div>

          <div className="form-row">
            <label>Client Name *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="form-grid">
            <div className="form-row">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="retainer">Retainer</option>
                <option value="project">Project</option>
                <option value="both">Both</option>
              </select>
            </div>

            {isOpportunity && (
              <div className="form-row">
                <label>Biz Dev Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            )}
          </div>

          {isOpportunity && (
            <div className="form-row">
              <label>Expected Start Date</label>
              <input
                type="month"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
          )}

          <div className="form-row">
            <label>Hourly Rate ($/hr)</label>
            <input
              type="number"
              min="0"
              value={form.hourlyRate}
              onChange={e => set('hourlyRate', e.target.value)}
              placeholder={`Default: $${defaultRate}`}
            />
          </div>

          {isRetainer && (
            <div className="form-grid">
              <div className="form-row">
                <label>Hours / Month</label>
                <input
                  type="number"
                  min="0"
                  value={form.hoursPerMonth}
                  onChange={e => set('hoursPerMonth', e.target.value)}
                  placeholder="e.g. 40"
                />
              </div>
              {isOpportunity && (
                <div className="form-row">
                  <label>Retainer Duration (months)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={form.retainerDuration}
                    onChange={e => set('retainerDuration', e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
              )}
            </div>
          )}

          {isProject && (
            <div className="form-row">
              <label>{isOpportunity ? 'Project Value ($)' : 'Project Budget (hrs)'}</label>
              <input
                type="number"
                min="0"
                value={isOpportunity ? form.projectValue : form.hoursPerMonth}
                onChange={e =>
                  isOpportunity
                    ? set('projectValue', e.target.value)
                    : set('hoursPerMonth', e.target.value)
                }
                placeholder={isOpportunity ? 'e.g. 25000' : 'e.g. 80'}
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">
              {client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
