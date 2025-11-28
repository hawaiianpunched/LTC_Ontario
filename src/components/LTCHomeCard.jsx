import React, { useState } from 'react'

const LTCHomeCard = ({ home }) => {
  const [expanded, setExpanded] = useState(false)

  const getMetricColor = (value, benchmark) => {
    if (!value || !benchmark) return 'bg-gray-100 text-gray-800'
    const numValue = parseFloat(value)
    const numBenchmark = parseFloat(benchmark)
    
    if (numValue <= numBenchmark) return 'bg-green-100 text-green-800'
    if (numValue <= numBenchmark * 1.5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const metrics = [
    { label: 'Antipsychotic Use', value: home.antipsychoticUse, benchmark: 19, unit: '%', icon: '💊' },
    { label: 'Falls', value: home.falls, benchmark: 9, unit: '%', icon: '⚠️' },
    { label: 'Physical Restraints', value: home.restraints, benchmark: 3, unit: '%', icon: '🔒' },
    { label: 'Pressure Ulcers', value: home.pressureUlcers, benchmark: 1, unit: '%', icon: '🏥' },
    { label: 'Pain', value: home.pain, benchmark: null, unit: '%', icon: '😣' },
    { label: 'Depression', value: home.depression, benchmark: 13, unit: '%', icon: '😔' },
  ]

  return (
    <div className="stat-card">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {home.name || 'Unknown Home'}
        </h3>
        
        {/* Location Information */}
        <div className="space-y-1 mb-3">
          {(home.address || home.city) && (
            <div className="flex items-start text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {home.address ? (
                  <>
                    {home.address}
                    {home.postalCode && `, ${home.postalCode}`}
                  </>
                ) : (
                  <>
                    {home.city}
                    {home.postalCode && `, ${home.postalCode}`}
                  </>
                )}
              </span>
            </div>
          )}
          {home.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{home.phone}</span>
            </div>
          )}
        </div>
        
        {/* Home Details Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {home.lhin && (
            <span className="metric-badge bg-blue-100 text-blue-800 text-xs">
              {home.lhin}
            </span>
          )}
          {home.homeType && (
            <span className="metric-badge bg-purple-100 text-purple-800 text-xs">
              {home.homeType}
            </span>
          )}
          {home.licensedBeds && (
            <span className="metric-badge bg-green-100 text-green-800 text-xs">
              🛏️ {home.licensedBeds} beds
            </span>
          )}
          {home.accreditation === 'Yes' && (
            <span className="metric-badge bg-emerald-100 text-emerald-800 text-xs">
              ✓ Accredited
            </span>
          )}
        </div>
      </div>

      {(home.waitTimeCommunity || home.waitTimeHospital) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg space-y-2">
          <div className="text-sm font-semibold text-gray-700 mb-2">Median Wait Times</div>
          
          {home.waitTimeCommunity && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">From Community:</span>
              <span className="text-lg font-bold text-blue-600">{home.waitTimeCommunity} days</span>
            </div>
          )}
          
          {home.waitTimeHospital && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">From Hospital:</span>
              <span className="text-lg font-bold text-purple-600">{home.waitTimeHospital} days</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {metrics.slice(0, expanded ? metrics.length : 3).map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center space-x-2">
              <span>{metric.icon}</span>
              <span className="text-sm text-gray-700">{metric.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`metric-badge ${getMetricColor(metric.value, metric.benchmark)}`}>
                {metric.value || 'N/A'}{metric.value && metric.unit}
              </span>
              {metric.benchmark && (
                <span className="text-xs text-gray-500">
                  (target: ≤{metric.benchmark}{metric.unit})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center space-x-1"
      >
        <span>{expanded ? 'Show Less' : 'Show More'}</span>
        <svg 
          className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {home.website && (
        <a
          href={home.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block w-full py-2 bg-primary-600 text-white text-center rounded-lg hover:bg-primary-700 transition-colors"
        >
          Visit Website
        </a>
      )}
    </div>
  )
}

export default LTCHomeCard

