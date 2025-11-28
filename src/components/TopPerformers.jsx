import React, { useState, useMemo } from 'react'

const TopPerformers = ({ homes }) => {
  const realHomes = homes.filter(h => !h.isProvincial)
  
  // Filter states
  const [selectedHomeType, setSelectedHomeType] = useState('All')
  const [selectedCity, setSelectedCity] = useState('All')
  const [filters, setFilters] = useState({
    waitTimeCommunity: { min: 0, max: 1000 },
    waitTimeHospital: { min: 0, max: 500 },
    antipsychoticUse: { min: 0, max: 100 },
    falls: { min: 0, max: 100 },
    restraints: { min: 0, max: 100 },
    pressureUlcers: { min: 0, max: 100 },
    pain: { min: 0, max: 100 },
    depression: { min: 0, max: 100 }
  })
  
  // Get unique values for dropdowns
  const homeTypes = useMemo(() => {
    const types = [...new Set(realHomes.map(h => h.homeType).filter(Boolean))]
    return ['All', ...types.sort()]
  }, [realHomes])
  
  const cities = useMemo(() => {
    const cityList = [...new Set(realHomes.map(h => h.city).filter(Boolean))]
    return ['All', ...cityList.sort()]
  }, [realHomes])
  
  // Filter homes based on all criteria
  const filteredHomes = useMemo(() => {
    return realHomes.filter(home => {
      // Home type filter
      if (selectedHomeType !== 'All' && home.homeType !== selectedHomeType) return false
      
      // City filter
      if (selectedCity !== 'All' && home.city !== selectedCity) return false
      
      // Numerical filters
      for (const [key, range] of Object.entries(filters)) {
        const value = home[key]
        if (value !== null && value !== undefined) {
          if (value < range.min || value > range.max) return false
        }
      }
      
      return true
    })
  }, [realHomes, selectedHomeType, selectedCity, filters])
  
  const updateFilter = (metric, minOrMax, value) => {
    setFilters(prev => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [minOrMax]: parseFloat(value)
      }
    }))
  }
  
  const resetFilters = () => {
    setSelectedHomeType('All')
    setSelectedCity('All')
    setFilters({
      waitTimeCommunity: { min: 0, max: 1000 },
      waitTimeHospital: { min: 0, max: 500 },
      antipsychoticUse: { min: 0, max: 100 },
      falls: { min: 0, max: 100 },
      restraints: { min: 0, max: 100 },
      pressureUlcers: { min: 0, max: 100 },
      pain: { min: 0, max: 100 },
      depression: { min: 0, max: 100 }
    })
  }
  
  const getTopPerformers = (metric, count = 10) => {
    return filteredHomes
      .filter(h => h[metric] !== null && h[metric] !== undefined)
      .sort((a, b) => parseFloat(a[metric]) - parseFloat(b[metric]))
      .slice(0, count)
  }
  
  const categories = [
    {
      title: 'Pressure Ulcers',
      metric: 'pressureUlcers',
      icon: '🏥',
      color: 'blue',
      benchmark: 1,
      unit: '%'
    },
    {
      title: 'Antipsychotic Use',
      metric: 'antipsychoticUse',
      icon: '💊',
      color: 'purple',
      benchmark: 19,
      unit: '%'
    },
    {
      title: 'Depression',
      metric: 'depression',
      icon: '😊',
      color: 'green',
      benchmark: 13,
      unit: '%'
    }
  ]
  
  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        header: 'bg-blue-500',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-800'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        header: 'bg-purple-500',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-800'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        header: 'bg-green-500',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-800'
      }
    }
    return colors[color]
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🌟 Top 10 Performing Homes (GTA)</h2>
            <p className="text-gray-600">
              Showing {filteredHomes.length} homes after filters
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            🔄 Reset Filters
          </button>
        </div>
        
        {/* Filters Section */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
          <div className="flex items-center mb-3">
            <h3 className="font-bold text-gray-900">📊 Filters</h3>
          </div>
          
          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏥 Home Type
              </label>
              <select
                value={selectedHomeType}
                onChange={(e) => setSelectedHomeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {homeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Numerical Sliders */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900 mb-3">
              🎚️ Quality Metric Ranges (Click to expand)
            </summary>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Wait Time Community */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⏱️ Wait Time (Community): {filters.waitTimeCommunity.min} - {filters.waitTimeCommunity.max} days
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.waitTimeCommunity.min}
                    onChange={(e) => updateFilter('waitTimeCommunity', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.waitTimeCommunity.max}
                    onChange={(e) => updateFilter('waitTimeCommunity', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Wait Time Hospital */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏥 Wait Time (Hospital): {filters.waitTimeHospital.min} - {filters.waitTimeHospital.max} days
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.waitTimeHospital.min}
                    onChange={(e) => updateFilter('waitTimeHospital', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.waitTimeHospital.max}
                    onChange={(e) => updateFilter('waitTimeHospital', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Antipsychotic Use */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💊 Antipsychotic Use: {filters.antipsychoticUse.min} - {filters.antipsychoticUse.max}%
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.antipsychoticUse.min}
                    onChange={(e) => updateFilter('antipsychoticUse', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.antipsychoticUse.max}
                    onChange={(e) => updateFilter('antipsychoticUse', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Falls */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⚠️ Falls: {filters.falls.min} - {filters.falls.max}%
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.falls.min}
                    onChange={(e) => updateFilter('falls', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.falls.max}
                    onChange={(e) => updateFilter('falls', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Restraints */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔒 Restraints: {filters.restraints.min} - {filters.restraints.max}%
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.restraints.min}
                    onChange={(e) => updateFilter('restraints', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.restraints.max}
                    onChange={(e) => updateFilter('restraints', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Pressure Ulcers */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏥 Pressure Ulcers: {filters.pressureUlcers.min} - {filters.pressureUlcers.max}%
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.pressureUlcers.min}
                    onChange={(e) => updateFilter('pressureUlcers', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.pressureUlcers.max}
                    onChange={(e) => updateFilter('pressureUlcers', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Pain */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  😣 Pain: {filters.pain.min} - {filters.pain.max}%
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.pain.min}
                    onChange={(e) => updateFilter('pain', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.pain.max}
                    onChange={(e) => updateFilter('pain', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Depression */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  😔 Depression: {filters.depression.min} - {filters.depression.max}%
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.depression.min}
                    onChange={(e) => updateFilter('depression', 'min', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.depression.max}
                    onChange={(e) => updateFilter('depression', 'max', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const topHomes = getTopPerformers(category.metric)
          const colors = getColorClasses(category.color)
          
          return (
            <div key={category.metric} className={`${colors.bg} border-2 ${colors.border} rounded-xl overflow-hidden`}>
              {/* Header */}
              <div className={`${colors.header} text-white p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-bold text-lg">{category.title}</h3>
                  </div>
                  <div className="text-sm opacity-90">
                    Target: ≤{category.benchmark}{category.unit}
                  </div>
                </div>
              </div>
              
              {/* List */}
              <div className="p-4">
                {topHomes.map((home, idx) => {
                  const value = parseFloat(home[category.metric])
                  const meetsBenchmark = value <= category.benchmark
                  
                  return (
                    <div
                      key={home.name}
                      className="bg-white rounded-lg p-3 mb-2 border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-bold text-gray-700 text-sm">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold text-gray-900 truncate">
                              {home.name}
                            </span>
                          </div>
                          {home.city && home.region && (
                            <div className="text-xs text-gray-600">
                              {home.city}, {home.region}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0 text-right">
                          <div className={`text-xl font-bold ${colors.text}`}>
                            {value}{category.unit}
                          </div>
                          {meetsBenchmark && (
                            <div className="text-xs text-green-600 font-semibold">
                              ✓ Meets target
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Footer Stats */}
              <div className="px-4 pb-4">
                <div className={`${colors.badge} rounded-lg p-3 text-center text-sm`}>
                  <div className="font-semibold">
                    Best Score: {topHomes[0] && parseFloat(topHomes[0][category.metric]).toFixed(1)}{category.unit}
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {topHomes.filter(h => parseFloat(h[category.metric]) <= category.benchmark).length} of 10 meet target
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TopPerformers

