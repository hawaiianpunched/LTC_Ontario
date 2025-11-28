import React from 'react'

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        <div className="mt-4 text-center text-white font-medium">
          Loading LTC Home Data...
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner

