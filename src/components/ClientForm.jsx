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
  pricingType: 'hourly',   // 'hourly' | 'fixed' — for existing client projects
  fixedAmount: '',
  notes: '',
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
      hourlyRate:      Number(form.hourlyRate)      || defaultRate,
      hoursPerMonth:   Number(form.hoursPerMonth)   || 0,
      retainerDuration:Number(form.retainerDuration)|| 12,
      projectValue:    Number(form.projectValue)    || 0,
      fixedAmount:     Number(form.fixedAmount)      || 0,
    })
  }

  const isRetainer    = form.type === 'retainer' || form.type === 'both'
  const isProject     = form.type === 'project'  || form.type === 'both'
  const isOpportunity = form.clientCategory === 'opportunity'
  const isFixed       = !isOpportunity && isProject && form.pricingType === 'fixed'

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
              <button type="button"
                className={form.clientCategory === 'opportunity' ? 'active' : ''}
                onClick={() => set('clientCategory', 'opportunity')}>
                Opportunity
              </button>
              <button type="button"
                className={form.clientCategory === 'existing' ? 'active' : ''}
                onClick={() => set('clientCategory', 'existing')}>
                Existing Client
              </button>
            </div>
            <p className="form-hint">
              {isOpportunity ? 'Appears in Forecast Clients' : 'Appears in Existing Clients'}
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
                  <option value="lost">Lost</option>
                </select>
              </div>
            )}
          </div>

          {isOpportunity && (
            <div className="form-row">
              <label>Expected Start Date</label>
              <input type="month" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
          )}

          {/* Project pricing toggle — existing clients only */}
          {isProject && !isOpportunity && (
            <div className="form-row">
              <label>Project Pricing</label>
              <div className="category-toggle">
                <button type="button"
                  className={form.pricingType === 'hourly' ? 'active' : ''}
                  onClick={() => set('pricingType', 'hourly')}>
                  Hourly (hrs × rate)
                </button>
                <button type="button"
                  className={form.pricingType === 'fixed' ? 'active' : ''}
                  onClick={() => set('pricingType', 'fixed')}>
                  Fixed Amount ($)
                </button>
              </div>
            </div>
          )}

          {/* Rate — hide for fixed-price projects (rate irrelevant) */}
          {!isFixed && (
            <div className="form-row">
              <label>Hourly Rate ($/hr)</label>
              <input
                type="number" min="0"
                value={form.hourlyRate}
                onChange={e => set('hourlyRate', e.target.value)}
                placeholder={`Default: $${defaultRate}`}
              />
            </div>
          )}

          {isRetainer && (
            <div className="form-grid">
              <div className="form-row">
                <label>Hours / Month</label>
                <input type="number" min="0"
                  value={form.hoursPerMonth}
                  onChange={e => set('hoursPerMonth', e.target.value)}
                  placeholder="e.g. 40"
                />
              </div>
              {isOpportunity && (
                <div className="form-row">
                  <label>Retainer Duration (months)</label>
                  <input type="number" min="1" max="60"
                    value={form.retainerDuration}
                    onChange={e => set('retainerDuration', e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
              )}
            </div>
          )}

          {isProject && (
            isOpportunity ? (
              /* Forecast client — always dollar value */
              <div className="form-row">
                <label>Project Value ($)</label>
                <input type="number" min="0"
                  value={form.projectValue}
                  onChange={e => set('projectValue', e.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>
            ) : form.pricingType === 'fixed' ? (
              /* Existing client — fixed dollar amount */
              <div className="form-row">
                <label>Fixed Project Amount ($)</label>
                <input type="number" min="0"
                  value={form.fixedAmount}
                  onChange={e => set('fixedAmount', e.target.value)}
                  placeholder="e.g. 25000"
                />
              </div>
            ) : (
              /* Existing client — hourly budget */
              <div className="form-row">
                <label>Project Budget (hrs)</label>
                <input type="number" min="0"
                  value={form.hoursPerMonth}
                  onChange={e => set('hoursPerMonth', e.target.value)}
                  placeholder="e.g. 80"
                />
              </div>
            )
          )}

          <div className="form-row">
            <label>Notes</label>
            <textarea
              className="form-notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Internal notes about this client..."
              rows={3}
            />
          </div>

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
