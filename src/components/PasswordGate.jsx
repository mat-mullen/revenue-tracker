import { useState } from 'react'

const PASSWORD = 'presidio2025'   // ← change this to whatever you want
const AUTH_KEY = 'arf-auth'

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === '1'
  })
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (value === PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1')
      setAuthed(true)
    } else {
      setError(true)
      setValue('')
    }
  }

  if (authed) return children

  return (
    <div className="password-gate">
      <div className="password-box">
        <div className="password-logo">
          <img src="/presidio-logo.png" alt="Presidio" className="password-logo-img" />
          <p>Internal use only</p>
        </div>
        <form onSubmit={handleSubmit} className="client-form" style={{ padding: 0, gap: 14 }}>
          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              value={value}
              onChange={e => { setValue(e.target.value); setError(false) }}
              placeholder="Enter password"
              autoFocus
            />
          </div>
          {error && <p className="password-error">Incorrect password — try again.</p>}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
