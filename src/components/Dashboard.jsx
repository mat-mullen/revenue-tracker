import { calculateMetrics, fmt } from '../utils/calculations'

export default function Dashboard({ clients, defaultRate }) {
  const { confirmedMonthly, confirmedAnnual, pendingMonthly, pendingAnnual } =
    calculateMetrics(clients, defaultRate)

  return (
    <div className="dashboard">
      <MetricCard
        label="Confirmed Monthly"
        value={fmt(confirmedMonthly)}
        sub="Recurring revenue"
        accent="green"
      />
      <MetricCard
        label="12-Month Confirmed"
        value={fmt(confirmedAnnual)}
        sub="Total projected confirmed"
        accent="green"
      />
      <MetricCard
        label="Pending Monthly"
        value={fmt(pendingMonthly)}
        sub="Potential recurring"
        accent="amber"
      />
      <MetricCard
        label="Total Upside (12 mo)"
        value={fmt(confirmedAnnual + pendingAnnual)}
        sub="Confirmed + all pending"
        accent="amber"
      />
    </div>
  )
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  )
}
