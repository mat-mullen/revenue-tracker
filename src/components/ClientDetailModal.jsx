import { useState } from 'react'

const MAX_FILE_BYTES = 3 * 1024 * 1024  // 3 MB — localStorage is limited

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const EMPTY = {
  primaryContact: { name: '', email: '' },
  billingContact: { name: '', email: '' },
  documents: { sow: null, msa: null },
}

export default function ClientDetailModal({ name, existing, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    primaryContact: { ...EMPTY.primaryContact, ...(existing?.primaryContact || {}) },
    billingContact: { ...EMPTY.billingContact, ...(existing?.billingContact || {}) },
    documents:      { ...EMPTY.documents,      ...(existing?.documents      || {}) },
  }))
  const [error, setError] = useState('')

  const setContact = (which, key, value) =>
    setForm(f => ({ ...f, [which]: { ...f[which], [key]: value } }))

  function handleFile(docKey, file) {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" is ${fmtSize(file.size)} — max upload size is 3 MB.`)
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setForm(f => ({
        ...f,
        documents: {
          ...f.documents,
          [docKey]: { name: file.name, size: file.size, type: file.type, dataUrl: reader.result },
        },
      }))
    }
    reader.readAsDataURL(file)
  }

  function removeDoc(docKey) {
    setForm(f => ({ ...f, documents: { ...f.documents, [docKey]: null } }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--wide">
        <div className="modal-header">
          <h2>Client Details — {name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="client-form">
          {/* Primary contact */}
          <div className="detail-section">
            <div className="detail-section-title">Primary Point of Contact</div>
            <div className="form-grid">
              <div className="form-row">
                <label>Name</label>
                <input
                  value={form.primaryContact.name}
                  onChange={e => setContact('primaryContact', 'name', e.target.value)}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input
                  type="email"
                  value={form.primaryContact.email}
                  onChange={e => setContact('primaryContact', 'email', e.target.value)}
                  placeholder="e.g. jane@clientco.com"
                />
              </div>
            </div>
          </div>

          {/* Billing contact */}
          <div className="detail-section">
            <div className="detail-section-title">Billing Point of Contact</div>
            <div className="form-grid">
              <div className="form-row">
                <label>Name</label>
                <input
                  value={form.billingContact.name}
                  onChange={e => setContact('billingContact', 'name', e.target.value)}
                  placeholder="e.g. Tom Jones"
                />
              </div>
              <div className="form-row">
                <label>Email</label>
                <input
                  type="email"
                  value={form.billingContact.email}
                  onChange={e => setContact('billingContact', 'email', e.target.value)}
                  placeholder="e.g. billing@clientco.com"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="detail-section">
            <div className="detail-section-title">Documents</div>
            <DocSlot label="SOW" doc={form.documents.sow}
              onUpload={f => handleFile('sow', f)} onRemove={() => removeDoc('sow')} fmtSize={fmtSize} />
            <DocSlot label="MSA" doc={form.documents.msa}
              onUpload={f => handleFile('msa', f)} onRemove={() => removeDoc('msa')} fmtSize={fmtSize} />
            {error && <p className="password-error">{error}</p>}
            <p className="form-hint">PDF or Word docs, up to 3 MB each. Stored locally in your browser.</p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Details</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DocSlot({ label, doc, onUpload, onRemove, fmtSize }) {
  return (
    <div className="doc-slot">
      <div className="doc-slot-label">{label}</div>
      {doc ? (
        <div className="doc-uploaded">
          <span className="doc-name">📄 {doc.name}</span>
          <span className="doc-size">{fmtSize(doc.size)}</span>
          <a href={doc.dataUrl} download={doc.name} className="doc-action">Download</a>
          <button type="button" className="doc-action doc-remove" onClick={onRemove}>Remove</button>
        </div>
      ) : (
        <label className="doc-upload-btn">
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hidden
            onChange={e => onUpload(e.target.files[0])}
          />
          + Upload {label}
        </label>
      )}
    </div>
  )
}
