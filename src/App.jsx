import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import RevenueChart from './components/RevenueChart'
import ClientTable from './components/ClientTable'
import ClientForm from './components/ClientForm'
import HourTracking from './components/HourTracking'
import PasswordGate from './components/PasswordGate'
import { initialClients } from './data/initialClients'
import './App.css'

const KEY_CLIENTS = 'arf-clients-v2'
const KEY_RATE = 'arf-default-rate'
const KEY_FORECAST = 'arf-forecast-start'

const FILTERS = ['all', 'confirmed', 'pending']

export default function App() {
  const [clients, setClients] = useState(() => {
    try {
      const s = localStorage.getItem(KEY_CLIENTS)
      return s ? JSON.parse(s) : initialClients
    } catch {
      return initialClients
    }
  })

  const [defaultRate, setDefaultRate] = useState(() => {
    const s = localStorage.getItem(KEY_RATE)
    return s ? Number(s) : 180
  })

  const [forecastStart, setForecastStart] = useState(() => {
    return localStorage.getItem(KEY_FORECAST) || '2025-05'
  })

  const [activeTab, setActiveTab] = useState('tracking')
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  useEffect(() => {
    localStorage.setItem(KEY_CLIENTS, JSON.stringify(clients))
  }, [clients])

  useEffect(() => {
    localStorage.setItem(KEY_RATE, String(defaultRate))
  }, [defaultRate])

  useEffect(() => {
    localStorage.setItem(KEY_FORECAST, forecastStart)
  }, [forecastStart])

  // Split by category — existing entries without clientCategory default to 'opportunity'
  const opportunityClients = clients.filter(
    c => !c.clientCategory || c.clientCategory === 'opportunity'
  )
  const existingClients = clients.filter(c => c.clientCategory === 'existing')

  const filteredClients = opportunityClients.filter(c => {
    if (filter === 'confirmed') return c.status === 'confirmed'
    if (filter === 'pending') return c.status !== 'confirmed'
    return true
  })

  function openAdd() {
    setEditingClient(null)
    setShowForm(true)
  }

  function openEdit(client) {
    setEditingClient(client)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingClient(null)
  }

  function handleSave(client) {
    if (client.id) {
      setClients(prev => prev.map(c => (c.id === client.id ? client : c)))
    } else {
      setClients(prev => [...prev, { ...client, id: Date.now().toString() }])
    }
    closeForm()
  }

  function handleDelete(id) {
    if (window.confirm('Remove this client?')) {
      setClients(prev => prev.filter(c => c.id !== id))
    }
  }

  function handleStatusChange(id, status) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const [year, month] = forecastStart.split('-')
  const forecastLabel = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <PasswordGate>
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <h1 className="app-title">Agency Revenue Forecaster</h1>
            <p className="app-sub">{forecastLabel} · 12-month projection</p>
          </div>
          <div className="topbar-controls">
            <div className="rate-field">
              <label>Forecast Start</label>
              <input
                type="month"
                value={forecastStart}
                onChange={e => setForecastStart(e.target.value)}
              />
            </div>
            <div className="rate-field">
              <label>Default Rate</label>
              <div className="rate-input-wrap">
                <span className="rate-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  value={defaultRate}
                  onChange={e => setDefaultRate(Number(e.target.value))}
                />
                <span className="rate-suffix">/hr</span>
              </div>
            </div>
            <button className="btn-primary" onClick={openAdd}>+ Add Client</button>
          </div>
        </div>
      </header>

      <div className="tab-bar">
        <div className="tab-bar-inner">
          <button className={`tab-bar-btn${activeTab === 'tracking' ? ' active' : ''}`} onClick={() => setActiveTab('tracking')}>
            Existing Clients
          </button>
          <button className={`tab-bar-btn${activeTab === 'forecast' ? ' active' : ''}`} onClick={() => setActiveTab('forecast')}>
            Forecast Clients
          </button>
        </div>
      </div>

      <main className="main">
        {activeTab === 'forecast' ? (
          <>
            <Dashboard clients={opportunityClients} defaultRate={defaultRate} />

            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Revenue Forecast</h2>
                <div className="filter-toggle">
                  {FILTERS.map(f => (
                    <button
                      key={f}
                      className={filter === f ? 'active' : ''}
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <RevenueChart
                clients={filteredClients}
                defaultRate={defaultRate}
                forecastStart={forecastStart}
              />
            </section>

            <section className="section">
              <div className="section-head">
                <h2 className="section-title">
                  Clients
                  <span className="count-badge">{filteredClients.length}</span>
                </h2>
              </div>
              <ClientTable
                clients={filteredClients}
                defaultRate={defaultRate}
                onEdit={openEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </section>
          </>
        ) : (
          <HourTracking defaultRate={defaultRate} addedClients={existingClients} />
        )}
      </main>

      {showForm && (
        <ClientForm
          client={editingClient}
          defaultRate={defaultRate}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
    </PasswordGate>
  )
}
