import React, { useMemo } from 'react'

const Analytics = ({ homes }) => {
  const analytics = useMemo(() => {
    const realHomes = homes.filter(h => !h.isProvincial)
    
    if (realHomes.length === 0) return null
    
    // Calculate statistics
    const getStats = (metric) => {
      const values = realHomes
        .map(h => h[metric])
        .filter(v => v !== null && v !== undefined)
        .map(v => parseFloat(v))
      
      if (values.length === 0) return { min: 'N/A', max: 'N/A', avg: 'N/A', median: 'N/A' }
      
      values.sort((a, b) => a - b)
      const sum = values.reduce((acc, v) => acc + v, 0)
      const avg = sum / values.length
      const median = values[Math.floor(values.length / 2)]
      
      return {
        min: values[0].toFixed(1),
        max: values[values.length - 1].toFixed(1),
        avg: avg.toFixed(1),
        median: median.toFixed(1)
      }
    }
    
    // Benchmarks
    const benchmarks = {
      antipsychoticUse: 19,
      falls: 9,
      restraints: 3,
      pressureUlcers: 1,
      depression: 13
    }
    
    // Count homes exceeding benchmarks
    const exceedingBenchmarks = {
      antipsychoticUse: realHomes.filter(h => h.antipsychoticUse > benchmarks.antipsychoticUse).length,
      falls: realHomes.filter(h => h.falls > benchmarks.falls).length,
      restraints: realHomes.filter(h => h.restraints > benchmarks.restraints).length,
      pressureUlcers: realHomes.filter(h => h.pressureUlcers > benchmarks.pressureUlcers).length,
      depression: realHomes.filter(h => h.depression > benchmarks.depression).length
    }
    
    // Best and worst performers
    const getBestWorst = (metric, isLowerBetter = true) => {
      const sorted = [...realHomes]
        .filter(h => h[metric] !== null && h[metric] !== undefined)
        .sort((a, b) => isLowerBetter ? a[metric] - b[metric] : b[metric] - a[metric])
      
      return {
        best: sorted.slice(0, 3),
        worst: sorted.slice(-3).reverse()
      }
    }
    
    return {
      totalHomes: realHomes.length,
      waitTimeCommunity: getStats('waitTimeCommunity'),
      waitTimeHospital: getStats('waitTimeHospital'),
      antipsychoticUse: getStats('antipsychoticUse'),
      falls: getStats('falls'),
      restraints: getStats('restraints'),
      pressureUlcers: getStats('pressureUlcers'),
      pain: getStats('pain'),
      depression: getStats('depression'),
      exceedingBenchmarks,
      bestFalls: getBestWorst('falls', true).best,
      worstFalls: getBestWorst('falls', true).worst,
      bestWaitCommunity: getBestWorst('waitTimeCommunity', true).best,
      worstWaitCommunity: getBestWorst('waitTimeCommunity', true).worst
    }
  }, [homes])
  
  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Analytics</h2>
        <p className="text-gray-600">Loading data...</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Provincial Analytics</h2>
      
      {/* Key Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Wait Time (Community)"
          stats={analytics.waitTimeCommunity}
          unit="days"
          color="purple"
        />
        <StatCard
          title="Wait Time (Hospital)"
          stats={analytics.waitTimeHospital}
          unit="days"
          color="indigo"
        />
        <StatCard
          title="Falls Rate"
          stats={analytics.falls}
          unit="%"
          color="orange"
          benchmark={9}
        />
        <StatCard
          title="Antipsychotic Use"
          stats={analytics.antipsychoticUse}
          unit="%"
          color="red"
          benchmark={19}
        />
      </div>
      
      {/* Benchmark Compliance */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎯 Benchmark Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BenchmarkCard
            title="Antipsychotic Use"
            benchmark={19}
            exceeding={analytics.exceedingBenchmarks.antipsychoticUse}
            total={analytics.totalHomes}
          />
          <BenchmarkCard
            title="Falls"
            benchmark={9}
            exceeding={analytics.exceedingBenchmarks.falls}
            total={analytics.totalHomes}
          />
          <BenchmarkCard
            title="Physical Restraints"
            benchmark={3}
            exceeding={analytics.exceedingBenchmarks.restraints}
            total={analytics.totalHomes}
          />
          <BenchmarkCard
            title="Pressure Ulcers"
            benchmark={1}
            exceeding={analytics.exceedingBenchmarks.pressureUlcers}
            total={analytics.totalHomes}
          />
          <BenchmarkCard
            title="Depression"
            benchmark={13}
            exceeding={analytics.exceedingBenchmarks.depression}
            total={analytics.totalHomes}
          />
        </div>
      </div>
      
      {/* Best and Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceCard
          title="🌟 Best - Shortest Wait Times (Community)"
          homes={analytics.bestWaitCommunity}
          metric="waitTimeCommunity"
          unit="days"
          isGood={true}
        />
        <PerformanceCard
          title="⚠️ Longest Wait Times (Community)"
          homes={analytics.worstWaitCommunity}
          metric="waitTimeCommunity"
          unit="days"
          isGood={false}
        />
        <PerformanceCard
          title="🌟 Best - Lowest Fall Rates"
          homes={analytics.bestFalls}
          metric="falls"
          unit="%"
          isGood={true}
        />
        <PerformanceCard
          title="⚠️ Highest Fall Rates"
          homes={analytics.worstFalls}
          metric="falls"
          unit="%"
          isGood={false}
        />
      </div>
    </div>
  )
}

const StatCard = ({ title, stats, unit, color, benchmark }) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  }
  
  return (
    <div className="bg-white border-2 border-gray-100 rounded-lg p-4">
      <div className={`text-xs font-semibold ${colorClasses[color]} px-2 py-1 rounded-full inline-block mb-2`}>
        {title}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Average:</span>
          <span className="font-bold">{stats.avg}{unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Median:</span>
          <span className="font-semibold">{stats.median}{unit}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Range:</span>
          <span>{stats.min} - {stats.max}{unit}</span>
        </div>
        {benchmark && (
          <div className="flex justify-between text-xs border-t pt-1 mt-1">
            <span className="text-gray-500">Benchmark:</span>
            <span className="font-semibold">≤{benchmark}{unit}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const BenchmarkCard = ({ title, benchmark, exceeding, total }) => {
  const compliant = total - exceeding
  const complianceRate = ((compliant / total) * 100).toFixed(1)
  const isGood = complianceRate >= 70
  
  return (
    <div className="bg-white rounded-lg p-4">
      <div className="text-sm font-semibold text-gray-700 mb-2">{title}</div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600">Benchmark: ≤{benchmark}%</span>
        <span className={`text-2xl font-bold ${isGood ? 'text-green-600' : 'text-red-600'}`}>
          {complianceRate}%
        </span>
      </div>
      <div className="text-xs text-gray-600">
        {compliant} of {total} homes compliant
      </div>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${complianceRate}%` }}
        />
      </div>
    </div>
  )
}

const PerformanceCard = ({ title, homes, metric, unit, isGood }) => {
  return (
    <div className={`rounded-lg p-4 ${isGood ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
      <h4 className="font-bold text-gray-900 mb-3">{title}</h4>
      <div className="space-y-2">
        {homes.map((home, idx) => (
          <div key={idx} className="bg-white rounded-lg p-3 flex justify-between items-center">
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900 truncate">
                {home.name}
              </div>
            </div>
            <div className={`text-lg font-bold ml-4 ${isGood ? 'text-green-600' : 'text-red-600'}`}>
              {home[metric]}{unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Analytics

