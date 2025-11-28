import React, { lazy, Suspense } from 'react'

// Lazy load the map to avoid SSR issues
const LTCMap = lazy(() => import('./LTCMap'))

const MapWrapper = ({ homes }) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <h2 className="text-2xl font-bold text-white mb-2">🗺️ LTC Homes Map</h2>
        <p className="text-white/90 text-sm">
          Interactive map showing homes across the Greater Toronto Area
        </p>
      </div>
      
      <div style={{ height: '600px', width: '100%' }}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        }>
          <LTCMap homes={homes} />
        </Suspense>
      </div>
    </div>
  )
}

export default MapWrapper

