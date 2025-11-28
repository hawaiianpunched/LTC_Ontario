import axios from 'axios'
import * as cheerio from 'cheerio'

const HQO_BASE_URL = 'https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance'

/**
 * Fetch LTC home data from Health Quality Ontario website
 */
export async function fetchLTCData() {
  try {
    console.log('🔍 Fetching data from Health Quality Ontario...')
    
    // Fetch the main page
    const response = await axios.get(HQO_BASE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 30000
    })

    const $ = cheerio.load(response.data)
    
    console.log('📄 Page loaded, analyzing structure...')
    
    // Log page structure to understand what we're working with
    const scripts = $('script').length
    const forms = $('form').length
    const tables = $('table').length
    
    console.log(`Found ${scripts} scripts, ${forms} forms, ${tables} tables`)
    
    // Check if data is loaded dynamically
    const scriptContent = $('script').text()
    
    // Look for API endpoints or data sources in scripts
    const apiMatches = scriptContent.match(/api[\/\w\-]*/gi) || []
    console.log('Potential API endpoints:', apiMatches.slice(0, 5))
    
    // Check for data attributes
    const dataAttributes = []
    $('*').each((i, el) => {
      const attrs = $(el).attr()
      if (attrs) {
        Object.keys(attrs).forEach(key => {
          if (key.startsWith('data-')) {
            dataAttributes.push(key)
          }
        })
      }
    })
    console.log('Data attributes found:', [...new Set(dataAttributes)].slice(0, 10))
    
    // Look for form inputs that might trigger data loading
    const searchInputs = $('input[type="text"], select').map((i, el) => ({
      id: $(el).attr('id'),
      name: $(el).attr('name'),
      class: $(el).attr('class')
    })).get()
    
    console.log('Search/Filter inputs:', searchInputs.slice(0, 5))
    
    return {
      success: true,
      message: 'Initial page analysis complete',
      debug: {
        scripts,
        forms,
        tables,
        hasSearchForm: searchInputs.length > 0
      }
    }
    
  } catch (error) {
    console.error('❌ Error fetching data:', error.message)
    throw error
  }
}

/**
 * Attempt to fetch data via potential API endpoints
 */
export async function searchForAPIEndpoints() {
  const potentialEndpoints = [
    'https://www.hqontario.ca/api/ltc-homes',
    'https://www.hqontario.ca/api/performance/ltc',
    'https://www.hqontario.ca/System-Performance/api/ltc',
    'https://www.hqontario.ca/portals/0/documents/system-performance/ltc-data.json',
  ]
  
  for (const endpoint of potentialEndpoints) {
    try {
      console.log(`🔍 Trying: ${endpoint}`)
      const response = await axios.get(endpoint, { timeout: 5000 })
      console.log(`✅ Success! Found API at: ${endpoint}`)
      return { endpoint, data: response.data }
    } catch (error) {
      console.log(`❌ Not found: ${endpoint}`)
    }
  }
  
  return null
}

/**
 * Parse LTC home data from HTML structure
 */
export function parseLTCHomeData($, element) {
  // This will be customized based on the actual HTML structure
  const home = {
    name: null,
    city: null,
    region: null,
    postalCode: null,
    waitTime: null,
    antipsychoticUse: null,
    falls: null,
    restraints: null,
    pressureUlcers: null,
    pain: null,
    depression: null,
    website: null
  }
  
  // Add parsing logic based on actual HTML structure
  
  return home
}

/**
 * Check if the website uses dynamic loading (JavaScript)
 */
export async function checkDynamicContent() {
  try {
    const response = await axios.get(HQO_BASE_URL)
    const $ = cheerio.load(response.data)
    
    // Check for common indicators of dynamic content
    const hasReact = $('script').text().includes('React') || $('[data-reactroot]').length > 0
    const hasAngular = $('script').text().includes('angular') || $('[ng-app]').length > 0
    const hasVue = $('script').text().includes('Vue') || $('[data-v-]').length > 0
    
    return {
      isDynamic: hasReact || hasAngular || hasVue,
      framework: hasReact ? 'React' : hasAngular ? 'Angular' : hasVue ? 'Vue' : 'Unknown',
      recommendation: hasReact || hasAngular || hasVue 
        ? 'Website uses dynamic content loading. Consider using Puppeteer or Playwright for scraping.'
        : 'Website appears to use static content. Standard scraping should work.'
    }
  } catch (error) {
    console.error('Error checking dynamic content:', error.message)
    return null
  }
}

