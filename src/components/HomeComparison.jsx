import React, { useState } from 'react'

const HomeComparison = ({ homes }) => {
  const [selectedHomes, setSelectedHomes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [activeSlot, setActiveSlot] = useState(null)
  
  const realHomes = homes.filter(h => !h.isProvincial).sort((a, b) => a.name.localeCompare(b.name))
  
  const filteredHomes = searchTerm.trim()
    ? realHomes.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.region?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []
  
  const addHome = (home) => {
    if (selectedHomes.length < 3 && !selectedHomes.find(h => h.name === home.name)) {
      setSelectedHomes([...selectedHomes, home])
      setSearchTerm('')
      setShowAutocomplete(false)
      setActiveSlot(null)
    }
  }
  
  const removeHome = (homeName) => {
    setSelectedHomes(selectedHomes.filter(h => h.name !== homeName))
  }
  
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowAutocomplete(value.trim().length > 0)
  }
  
  const handleSearchFocus = () => {
    if (searchTerm.trim().length > 0) {
      setShowAutocomplete(true)
    }
  }
  
  const getBenchmarkStatus = (value, benchmark, isLowerBetter = true) => {
    if (!value || !benchmark) return 'neutral'
    const numValue = parseFloat(value)
    const numBenchmark = parseFloat(benchmark)
    
    if (isLowerBetter) {
      if (numValue <= numBenchmark) return 'good'
      if (numValue <= numBenchmark * 1.5) return 'warning'
      return 'bad'
    }
    return 'neutral'
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 border-green-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'bad': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }
  
  const getBestInCategory = (metric) => {
    if (selectedHomes.length === 0) return null
    const validHomes = selectedHomes.filter(h => h[metric] !== null && h[metric] !== undefined)
    if (validHomes.length === 0) return null
    
    return validHomes.reduce((best, home) => {
      const homeValue = parseFloat(home[metric])
      const bestValue = parseFloat(best[metric])
      return homeValue < bestValue ? home : best
    })
  }
  
  const metrics = [
    { key: 'waitTimeCommunity', label: 'Wait Time (Community)', unit: ' days', benchmark: null },
    { key: 'waitTimeHospital', label: 'Wait Time (Hospital)', unit: ' days', benchmark: null },
    { key: 'antipsychoticUse', label: 'Antipsychotic Use', unit: '%', benchmark: 19 },
    { key: 'falls', label: 'Falls', unit: '%', benchmark: 9 },
    { key: 'restraints', label: 'Physical Restraints', unit: '%', benchmark: 3 },
    { key: 'pressureUlcers', label: 'Pressure Ulcers', unit: '%', benchmark: 1 },
    { key: 'pain', label: 'Pain', unit: '%', benchmark: null },
    { key: 'depression', label: 'Depression', unit: '%', benchmark: 13 }
  ]
  
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔍 Compare LTC Homes</h2>
        <div className="text-sm text-gray-600">
          Select up to 3 homes to compare
        </div>
      </div>
      
      {/* Search Bar with Autocomplete */}
      {selectedHomes.length < 3 && (
        <div className="mb-6 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search for a home to add (start typing...)"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              className="w-full px-4 py-3 pr-10 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-lg"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setShowAutocomplete(false)
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && filteredHomes.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-primary-500 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
              <div className="p-2 bg-primary-50 border-b border-primary-200 text-sm text-gray-600">
                {filteredHomes.length} home{filteredHomes.length !== 1 ? 's' : ''} found
              </div>
              {filteredHomes.slice(0, 100).map((home) => {
                const isSelected = selectedHomes.find(h => h.name === home.name)
                return (
                  <button
                    key={home.name}
                    onClick={() => addHome(home)}
                    disabled={isSelected}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      isSelected
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{home.name}</div>
                    {home.city && home.region && (
                      <div className="text-sm text-gray-600 mt-1">
                        {home.city}, {home.region}
                        {isSelected && <span className="ml-2 text-primary-600">✓ Already selected</span>}
                      </div>
                    )}
                    {isSelected && !home.city && (
                      <div className="text-sm text-primary-600 mt-1">✓ Already selected</div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          
          {showAutocomplete && searchTerm.trim() && filteredHomes.length === 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
              No homes found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
      
      {/* Selected Homes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map((slot) => {
          const home = selectedHomes[slot]
          
          if (!home) {
            return (
              <div
                key={slot}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-400"
              >
                <div className="text-4xl mb-2">📋</div>
                <div className="font-semibold">Home Slot {slot + 1}</div>
                <div className="text-sm">Use search above to add</div>
              </div>
            )
          }
          
          return (
            <div key={slot} className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50 relative">
              <button
                onClick={() => removeHome(home.name)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm font-bold"
              >
                ×
              </button>
              <div className="font-bold text-gray-900 mb-1 pr-6">{home.name}</div>
              {home.city && home.region && (
                <div className="text-sm text-gray-600">{home.city}, {home.region}</div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Comparison Table */}
      {selectedHomes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Metric</th>
                <th className="text-center py-3 px-4 font-bold text-gray-600 text-sm">
                  Provincial<br/>Benchmark
                </th>
                {selectedHomes.map((home, idx) => (
                  <th key={idx} className="text-center py-3 px-4">
                    <div className="font-bold text-primary-700 text-sm leading-tight">
                      {home.name}
                    </div>
                    {home.city && (
                      <div className="text-xs text-gray-500 mt-1 font-normal">
                        {home.city}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const bestHome = getBestInCategory(metric.key)
                
                return (
                  <tr key={metric.key} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{metric.label}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {metric.benchmark ? (
                        <div className="text-sm">
                          <div className="font-semibold text-gray-700">≤ {metric.benchmark}{metric.unit}</div>
                          <div className="text-xs text-gray-500">(lower is better)</div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">N/A</div>
                      )}
                    </td>
                    {selectedHomes.map((home, idx) => {
                      const value = home[metric.key]
                      const status = metric.benchmark 
                        ? getBenchmarkStatus(value, metric.benchmark, true)
                        : 'neutral'
                      const isBest = bestHome && bestHome.name === home.name
                      
                      return (
                        <td key={idx} className="py-4 px-4 text-center">
                          {value !== null && value !== undefined ? (
                            <div className="relative">
                              <div className={`inline-block px-4 py-2 rounded-lg border-2 font-bold ${getStatusColor(status)}`}>
                                {value}{metric.unit}
                              </div>
                              {isBest && (
                                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                  ⭐
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="font-semibold text-gray-700">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-green-100 text-green-800 border-2 border-green-300">
                ✓ Meets Benchmark
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-800 border-2 border-yellow-300">
                ⚠ Above Benchmark
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-red-100 text-red-800 border-2 border-red-300">
                ✗ Significantly Above
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-yellow-600 text-lg">⭐ = Best in Category</div>
            </div>
          </div>
        </div>
      )}
      
      {selectedHomes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🏥</div>
          <div className="text-lg font-semibold mb-2">No homes selected for comparison</div>
          <div className="text-sm">Click the "+" boxes above to add up to 3 homes</div>
        </div>
      )}
    </div>
  )
}

export default HomeComparison

