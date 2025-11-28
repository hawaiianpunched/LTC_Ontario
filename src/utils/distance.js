/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

function toRad(degrees) {
  return degrees * (Math.PI / 180)
}

/**
 * Approximate coordinates for Ontario cities
 */
const CITY_COORDINATES = {
  'TORONTO': [43.6532, -79.3832],
  'SCARBOROUGH': [43.7732, -79.2578],
  'ETOBICOKE': [43.6205, -79.5132],
  'NORTH YORK': [43.7615, -79.4111],
  'MISSISSAUGA': [43.5890, -79.6441],
  'BRAMPTON': [43.7315, -79.7624],
  'MARKHAM': [43.8561, -79.3370],
  'VAUGHAN': [43.8361, -79.4982],
  'RICHMOND HILL': [43.8828, -79.4403],
  'OAKVILLE': [43.4675, -79.6877],
  'BURLINGTON': [43.3255, -79.7990],
  'PICKERING': [43.8384, -79.0868],
  'AJAX': [43.8509, -79.0204],
  'WHITBY': [43.8975, -78.9429],
  'OSHAWA': [43.8971, -78.8658],
  'MILTON': [43.5183, -79.8774],
  'NEWMARKET': [44.0592, -79.4613],
  'AURORA': [43.9995, -79.4504],
  'KING CITY': [43.9228, -79.5292],
  'STOUFFVILLE': [43.9706, -79.2447],
  'CALEDON': [43.8672, -79.8608],
  'GEORGINA': [44.2991, -79.4347],
  'UXBRIDGE': [44.1089, -79.1206],
  'HAMILTON': [43.2557, -79.8711],
  'ORANGEVILLE': [43.9197, -80.0943],
  'GEORGETOWN': [43.6458, -79.9222],
  'WOODBRIDGE': [43.7828, -79.5986],
  'CONCORD': [43.7970, -79.4872],
  'THORNHILL': [43.8089, -79.4214]
}

// Downtown Toronto coordinates
const DOWNTOWN_TORONTO = [43.6532, -79.3832]

/**
 * Get approximate coordinates for a city
 */
export function getCityCoordinates(city) {
  if (!city) return null
  const normalized = city.toUpperCase().trim()
  return CITY_COORDINATES[normalized] || null
}

/**
 * Calculate distance from downtown Toronto
 */
export function distanceFromTorontoDowntown(city) {
  const coords = getCityCoordinates(city)
  if (!coords) return null
  
  return calculateDistance(
    DOWNTOWN_TORONTO[0],
    DOWNTOWN_TORONTO[1],
    coords[0],
    coords[1]
  )
}

/**
 * Filter homes within a certain radius of downtown Toronto
 */
export function filterHomesByTorontoRadius(homes, radiusKm = 40) {
  return homes.filter(home => {
    if (home.isProvincial) return false
    
    const distance = distanceFromTorontoDowntown(home.city)
    return distance !== null && distance <= radiusKm
  })
}

