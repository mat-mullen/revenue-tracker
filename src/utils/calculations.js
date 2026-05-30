const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getMonthLabels(forecastStart) {
  let startYear, startMonth
  if (forecastStart) {
    const [y, m] = forecastStart.split('-').map(Number)
    startYear = y
    startMonth = m - 1
  } else {
    const now = new Date()
    startYear = now.getFullYear()
    startMonth = now.getMonth()
  }
  return Array.from({ length: 12 }, (_, i) => {
    const totalMonth = startMonth + i
    const month = totalMonth % 12
    const year = startYear + Math.floor(totalMonth / 12)
    return `${MONTH_NAMES[month]} '${String(year).slice(2)}`
  })
}

export function clientMonthlyRetainer(client, defaultRate) {
  if (client.type === 'project') return 0
  const rate = client.hourlyRate || defaultRate
  return rate * (client.hoursPerMonth || 0)
}

export function getClientRevenueForMonth(client, monthIndex, defaultRate) {
  let revenue = 0
  const rate = client.hourlyRate || defaultRate

  if (client.type === 'retainer' || client.type === 'both') {
    const duration = client.retainerDuration || 12
    if (monthIndex < duration) {
      revenue += rate * (client.hoursPerMonth || 0)
    }
  }

  if ((client.type === 'project' || client.type === 'both') && monthIndex === 0) {
    revenue += client.projectValue || 0
  }

  return revenue
}

export function isConfirmed(client) {
  return client.status === 'confirmed'
}

export function calculateMetrics(clients, defaultRate) {
  const confirmed = clients.filter(isConfirmed)
  const pending = clients.filter(c => !isConfirmed(c))

  const confirmedMonthly = confirmed.reduce(
    (sum, c) => sum + clientMonthlyRetainer(c, defaultRate), 0
  )

  const confirmedAnnual = confirmed.reduce((sum, c) => {
    let total = 0
    for (let i = 0; i < 12; i++) total += getClientRevenueForMonth(c, i, defaultRate)
    return sum + total
  }, 0)

  const pendingMonthly = pending.reduce(
    (sum, c) => sum + clientMonthlyRetainer(c, defaultRate), 0
  )

  const pendingAnnual = pending.reduce((sum, c) => {
    let total = 0
    for (let i = 0; i < 12; i++) total += getClientRevenueForMonth(c, i, defaultRate)
    return sum + total
  }, 0)

  return { confirmedMonthly, confirmedAnnual, pendingMonthly, pendingAnnual }
}

export function getChartData(clients, defaultRate) {
  const confirmed = clients.filter(isConfirmed)
  const pending = clients.filter(c => !isConfirmed(c))

  return Array.from({ length: 12 }, (_, i) => {
    const confirmedRetainer = confirmed.reduce((sum, c) => {
      if (c.type === 'project') return sum
      const rate = c.hourlyRate || defaultRate
      const duration = c.retainerDuration || 12
      return sum + (i < duration ? rate * (c.hoursPerMonth || 0) : 0)
    }, 0)

    const confirmedProject = i === 0
      ? confirmed.reduce((sum, c) => {
          if (c.type === 'retainer') return sum
          return sum + (c.projectValue || 0)
        }, 0)
      : 0

    const pendingRetainer = pending.reduce((sum, c) => {
      if (c.type === 'project') return sum
      const rate = c.hourlyRate || defaultRate
      const duration = c.retainerDuration || 12
      return sum + (i < duration ? rate * (c.hoursPerMonth || 0) : 0)
    }, 0)

    const pendingProject = i === 0
      ? pending.reduce((sum, c) => {
          if (c.type === 'retainer') return sum
          return sum + (c.projectValue || 0)
        }, 0)
      : 0

    return { confirmedRetainer, confirmedProject, pendingRetainer, pendingProject }
  })
}

export function fmt(n) {
  return '$' + Math.round(n).toLocaleString()
}
