import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { getChartData, getMonthLabels } from '../utils/calculations'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function RevenueChart({ clients, defaultRate, forecastStart }) {
  const monthly = getChartData(clients, defaultRate)
  const labels = getMonthLabels(forecastStart)

  const data = {
    labels,
    datasets: [
      {
        label: 'Confirmed monthly',
        data: monthly.map(d => d.confirmedRetainer),
        backgroundColor: '#22c55e',
        stack: 'revenue',
        borderSkipped: false,
      },
      {
        label: 'Pending monthly',
        data: monthly.map(d => d.pendingRetainer),
        backgroundColor: '#f59e0b',
        stack: 'revenue',
        borderSkipped: false,
      },
      {
        label: 'Confirmed project',
        data: monthly.map(d => d.confirmedProject),
        backgroundColor: '#86efac',
        stack: 'revenue',
        borderSkipped: false,
      },
      {
        label: 'Pending project',
        data: monthly.map(d => d.pendingProject),
        backgroundColor: '#fcd34d',
        stack: 'revenue',
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
        ticks: { color: '#6B7280', font: { size: 12 } },
        border: { color: '#E2E2DF' },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
        ticks: {
          color: '#6B7280',
          font: { size: 12 },
          callback: v => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v),
        },
        border: { color: '#E2E2DF' },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#6B7280', boxWidth: 12, padding: 20, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#111111',
        borderColor: '#333333',
        borderWidth: 1,
        titleColor: '#FFFFFF',
        bodyColor: '#CCCCCC',
        padding: 12,
        callbacks: {
          label: ctx => {
            if (ctx.raw === 0) return null
            return ` ${ctx.dataset.label}: $${Math.round(ctx.raw).toLocaleString()}`
          },
          footer: items => {
            const total = items.reduce((s, i) => s + i.raw, 0)
            if (total === 0) return null
            return `Total: $${Math.round(total).toLocaleString()}`
          },
        },
      },
    },
  }

  return (
    <div className="chart-wrap">
      <Bar data={data} options={options} />
    </div>
  )
}
