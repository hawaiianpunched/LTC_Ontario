import React from 'react'

const StatsOverview = ({ homes }) => {
  const calculateAverage = (metric) => {
    const validHomes = homes.filter(h => h[metric] !== null && h[metric] !== undefined && !h.isProvincial)
    if (validHomes.length === 0) return 'N/A'
    const sum = validHomes.reduce((acc, h) => acc + parseFloat(h[metric] || 0), 0)
    return (sum / validHomes.length).toFixed(1)
  }

  const realHomes = homes.filter(h => !h.isProvincial)
  
  const stats = [
    {
      label: 'Total Homes',
      value: realHomes.length,
      icon: '🏥',
      color: 'bg-blue-500'
    },
    {
      label: 'Avg Wait (Community)',
      value: calculateAverage('waitTimeCommunity') + ' days',
      icon: '⏱️',
      color: 'bg-purple-500'
    },
    {
      label: 'Avg Wait (Hospital)',
      value: calculateAverage('waitTimeHospital') + ' days',
      icon: '🏥',
      color: 'bg-indigo-500'
    },
    {
      label: 'Avg Fall Rate',
      value: calculateAverage('falls') + '%',
      icon: '⚠️',
      color: 'bg-orange-500'
    },
    {
      label: 'Avg Antipsychotic',
      value: calculateAverage('antipsychoticUse') + '%',
      icon: '💊',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <div className={`${stat.color} text-white px-2 py-1 rounded-full text-xs font-bold`}>
              {stat.label}
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsOverview

