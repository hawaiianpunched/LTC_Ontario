import React from 'react'

const FilterPanel = ({ selectedRegion, onRegionChange, regions }) => {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Region
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="all">All Regions</option>
          {regions.sort().map(region => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default FilterPanel

