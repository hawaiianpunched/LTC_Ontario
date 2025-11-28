import React from 'react'

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 rounded-lg p-2">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Ontario LTC Viewer
              </h1>
              <p className="text-sm text-gray-500">
                Long-Term Care Performance Metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View Source Data
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

