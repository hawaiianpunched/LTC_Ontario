import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import StatsOverview from './components/StatsOverview'
import LoadingSpinner from './components/LoadingSpinner'
import FilterPanel from './components/FilterPanel'
import HomeComparison from './components/HomeComparison'
import TopPerformers from './components/TopPerformers'
import { filterHomesByTorontoRadius } from './utils/distance'

function App() {
  const [ltcHomes, setLtcHomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showComparison, setShowComparison] = useState(true)

  useEffect(() => {
    fetchLTCData()
  }, [])

  const fetchLTCData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ltc-homes')
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const result = await response.json()
      
      // Handle both old format (array) and new format (object with data property)
      let data = Array.isArray(result) ? result : result.data
      
      // Filter to homes within 40km of downtown Toronto
      const torontoAreaHomes = filterHomesByTorontoRadius(data || [], 40)
      console.log(`🏙️ Filtered to ${torontoAreaHomes.length} homes within 40km of downtown Toronto`)
      
      setLtcHomes(torontoAreaHomes)
      setError(null)
      
      // Log data source info
      if (result.lastUpdated) {
        console.log('📊 Data last updated:', new Date(result.lastUpdated).toLocaleString())
        console.log('📍 Source:', result.source)
      }
    } catch (err) {
      setError('Unable to load LTC home data. Please try again later.')
      console.error('Error fetching LTC data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-12">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Greater Toronto Area LTC Home Comparison
          </h1>
          <p className="text-white/80 text-lg">
            Compare homes within 40km of downtown Toronto
          </p>
          {ltcHomes.length > 0 && (
            <div className="text-white/70 mt-2 text-sm">
              Showing {ltcHomes.length} homes in the Toronto area
            </div>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">
              {error}
            </div>
            <button 
              onClick={fetchLTCData}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <StatsOverview homes={ltcHomes} />
            
            {/* Home Comparison Tool */}
            <HomeComparison homes={ltcHomes} />
            
            {/* Top Performers */}
            <TopPerformers homes={ltcHomes} />
          </>
        )}
      </main>

      <footer className="bg-white/10 backdrop-blur-sm mt-12 py-6 text-center text-white">
        <p className="text-sm">
          Data source: <a 
            href="https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-white/80"
          >
            Health Quality Ontario
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App

