import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons for different performance levels
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

const greenIcon = createCustomIcon('#10b981')
const yellowIcon = createCustomIcon('#f59e0b')
const redIcon = createCustomIcon('#ef4444')
const grayIcon = createCustomIcon('#6b7280')

// Geocode Ontario postal codes to approximate coordinates
function postalCodeToCoords(postalCode, city) {
  if (!postalCode) return null
  
  // Simplified geocoding for Ontario cities
  const cityCoords = {
    'TORONTO': [43.6532, -79.3832],
    'OTTAWA': [45.4215, -75.6972],
    'MISSISSAUGA': [43.5890, -79.6441],
    'BRAMPTON': [43.7315, -79.7624],
    'HAMILTON': [43.2557, -79.8711],
    'LONDON': [42.9849, -81.2453],
    'MARKHAM': [43.8561, -79.3370],
    'VAUGHAN': [43.8361, -79.4982],
    'KITCHENER': [43.4516, -80.4925],
    'WINDSOR': [42.3149, -83.0364],
    'OSHAWA': [43.8971, -78.8658],
    'BARRIE': [44.3894, -79.6903],
    'KINGSTON': [44.2312, -76.4860],
    'SUDBURY': [46.4917, -80.9930],
    'THUNDER BAY': [48.3809, -89.2477],
    'PETERBOROUGH': [44.3091, -78.3197],
    'ST. CATHARINES': [43.1594, -79.2469],
    'SARNIA': [42.9745, -82.4066],
    'GUELPH': [43.5448, -80.2482],
    'WATERLOO': [43.4643, -80.5204],
    'BURLINGTON': [43.3255, -79.7990],
    'OAKVILLE': [43.4675, -79.6877],
    'PICKERING': [43.8384, -79.0868],
    'AJAX': [43.8509, -79.0204],
    'WHITBY': [43.8975, -78.9429],
    'NIAGARA FALLS': [43.0896, -79.0849],
    'CAMBRIDGE': [43.3616, -80.3144],
    'BRANTFORD': [43.1394, -80.2644],
    'ORANGEVILLE': [43.9197, -80.0943],
    'COLLINGWOOD': [44.5011, -80.2167],
    'ORILLIA': [44.6082, -79.4196],
    'AURORA': [43.9995, -79.4504],
    'NEWMARKET': [44.0592, -79.4613],
    'NORTH BAY': [46.3091, -79.4608]
  }
  
  const cityNormalized = city?.toUpperCase()
  if (cityNormalized && cityCoords[cityNormalized]) {
    const [baseLat, baseLng] = cityCoords[cityNormalized]
    // Add small random offset to spread out markers in the same city
    const offset = 0.02
    return [
      baseLat + (Math.random() - 0.5) * offset,
      baseLng + (Math.random() - 0.5) * offset
    ]
  }
  
  return null
}

// Calculate overall performance score
function getPerformanceScore(home) {
  const metrics = [
    { value: home.pressureUlcers, benchmark: 1, weight: 1.5 },
    { value: home.antipsychoticUse, benchmark: 19, weight: 1.2 },
    { value: home.depression, benchmark: 13, weight: 1.0 },
    { value: home.restraints, benchmark: 3, weight: 1.3 },
    { value: home.falls, benchmark: 9, weight: 1.0 }
  ]
  
  let totalScore = 0
  let totalWeight = 0
  
  metrics.forEach(({ value, benchmark, weight }) => {
    if (value !== null && value !== undefined && benchmark) {
      const ratio = value / benchmark
      const score = Math.max(0, 1 - (ratio - 1) * 0.5) // Score 1 = at benchmark, lower is worse
      totalScore += score * weight
      totalWeight += weight
    }
  })
  
  return totalWeight > 0 ? totalScore / totalWeight : 0.5
}

// Get marker icon based on performance
function getMarkerIcon(home) {
  const score = getPerformanceScore(home)
  if (score >= 0.85) return greenIcon
  if (score >= 0.65) return yellowIcon
  if (score >= 0) return redIcon
  return grayIcon
}

const LTCMap = ({ homes, onHomeSelect }) => {
  const [mapHomes, setMapHomes] = useState([])
  const [center, setCenter] = useState([43.6532, -79.3832]) // Downtown Toronto
  const [selectedHome, setSelectedHome] = useState(null)
  
  useEffect(() => {
    // Process homes to add coordinates
    const homesWithCoords = homes
      .filter(h => !h.isProvincial)
      .map(home => {
        const coords = postalCodeToCoords(home.postalCode, home.city)
        if (coords) {
          return { ...home, coords }
        }
        return null
      })
      .filter(Boolean)
    
    setMapHomes(homesWithCoords)
  }, [homes])
  
  const handleMarkerClick = (home) => {
    setSelectedHome(home)
    if (onHomeSelect) {
      onHomeSelect(home)
    }
  }
  
  if (!mapHomes || mapHomes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 p-8">
        <p className="text-gray-600">No homes with location data available for mapping.</p>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold mb-2 text-gray-700">Performance</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
            <span className="text-xs text-gray-600">Excellent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
            <span className="text-xs text-gray-600">Good</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
            <span className="text-xs text-gray-600">Needs Improvement</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
          {mapHomes.length} homes shown
        </div>
      </div>
      
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {mapHomes.map((home, idx) => (
            <Marker
              key={idx}
              position={home.coords}
              icon={getMarkerIcon(home)}
              eventHandlers={{
                click: () => handleMarkerClick(home)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <h3 className="font-bold text-gray-900 mb-2">{home.name}</h3>
                  
                  <div className="space-y-1 text-sm mb-3">
                    {home.address && (
                      <p className="text-gray-600">📍 {home.address}</p>
                    )}
                    {home.city && (
                      <p className="text-gray-600">{home.city}, {home.postalCode}</p>
                    )}
                    {home.lhin && (
                      <p className="text-blue-600 font-medium">{home.lhin}</p>
                    )}
                    {home.licensedBeds && (
                      <p className="text-gray-700">🛏️ {home.licensedBeds} beds</p>
                    )}
                    {home.homeType && (
                      <p className="text-gray-700">🏥 {home.homeType}</p>
                    )}
                  </div>
                  
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-xs font-semibold text-gray-700">Key Metrics:</p>
                    {home.pressureUlcers && (
                      <p className="text-xs">Pressure Ulcers: <span className="font-bold">{home.pressureUlcers}%</span></p>
                    )}
                    {home.antipsychoticUse && (
                      <p className="text-xs">Antipsychotic Use: <span className="font-bold">{home.antipsychoticUse}%</span></p>
                    )}
                    {home.depression && (
                      <p className="text-xs">Depression: <span className="font-bold">{home.depression}%</span></p>
                    )}
                  </div>
                  
                  {home.website && (
                    <a
                      href={home.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-center py-1 px-3 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
    </div>
  )
}

export default LTCMap

