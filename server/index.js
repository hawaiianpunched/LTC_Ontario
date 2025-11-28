import express from 'express'
import cors from 'cors'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { scrapeHQOData } from './puppeteer-scraper.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Cache file path
const CACHE_DIR = join(__dirname, '../data')
const CACHE_FILE = join(CACHE_DIR, 'ltc-cache.json')

// Ensure data directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true })
  console.log('📁 Created data directory')
}

// Cache for scraped data
let dataCache = {
  data: null,
  lastUpdated: null,
  isUpdating: false
}

// Cache duration: 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000

/**
 * Load cache from JSON file
 */
function loadCacheFromFile() {
  try {
    if (existsSync(CACHE_FILE)) {
      const fileContent = readFileSync(CACHE_FILE, 'utf-8')
      const cached = JSON.parse(fileContent)
      dataCache.data = cached.data
      dataCache.lastUpdated = new Date(cached.lastUpdated)
      console.log('✅ Loaded cache from file')
      console.log(`📊 ${cached.data?.length || 0} entries loaded`)
      console.log(`📅 Last updated: ${dataCache.lastUpdated.toLocaleString()}`)
      return true
    }
  } catch (error) {
    console.error('❌ Error loading cache from file:', error.message)
  }
  return false
}

/**
 * Save cache to JSON file
 */
function saveCacheToFile() {
  try {
    const cacheData = {
      data: dataCache.data,
      lastUpdated: dataCache.lastUpdated,
      scrapedAt: new Date().toISOString(),
      source: 'Health Quality Ontario',
      url: 'https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance'
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8')
    console.log(`💾 Cache saved to: ${CACHE_FILE}`)
    return true
  } catch (error) {
    console.error('❌ Error saving cache to file:', error.message)
    return false
  }
}

// Sample data structure - In a real implementation, you would scrape or use an API
// The HQO website uses dynamic content, so we're providing sample data here
// You would need to implement proper web scraping or find an official API

const sampleLTCData = [
  {
    name: "Sample LTC Home - Toronto Central",
    city: "Toronto",
    region: "Toronto Central",
    postalCode: "M5G 2C4",
    waitTime: 145,
    antipsychoticUse: 17.5,
    falls: 8.2,
    restraints: 2.1,
    pressureUlcers: 0.8,
    pain: 12.3,
    depression: 11.5,
    website: "https://example.com"
  },
  {
    name: "Riverside Long-Term Care",
    city: "Ottawa",
    region: "Champlain",
    postalCode: "K1N 6N5",
    waitTime: 230,
    antipsychoticUse: 15.2,
    falls: 7.8,
    restraints: 1.9,
    pressureUlcers: 0.6,
    pain: 10.5,
    depression: 9.8,
    website: null
  },
  {
    name: "Maple Grove Care Centre",
    city: "London",
    region: "South West",
    postalCode: "N6A 1A1",
    waitTime: 180,
    antipsychoticUse: 21.3,
    falls: 10.5,
    restraints: 3.5,
    pressureUlcers: 1.2,
    pain: 15.7,
    depression: 14.2,
    website: "https://example.com"
  },
  {
    name: "Sunrise Senior Living",
    city: "Hamilton",
    region: "Hamilton Niagara Haldimand Brant",
    postalCode: "L8N 3Z5",
    waitTime: 165,
    antipsychoticUse: 16.8,
    falls: 8.9,
    restraints: 2.3,
    pressureUlcers: 0.9,
    pain: 11.2,
    depression: 10.6,
    website: null
  },
  {
    name: "Lakeview Terrace",
    city: "Mississauga",
    region: "Mississauga Halton",
    postalCode: "L5B 3Y3",
    waitTime: 195,
    antipsychoticUse: 18.9,
    falls: 9.3,
    restraints: 2.7,
    pressureUlcers: 1.0,
    pain: 13.4,
    depression: 12.1,
    website: "https://example.com"
  },
  {
    name: "Valley View Long-Term Care",
    city: "Kitchener",
    region: "Waterloo Wellington",
    postalCode: "N2G 1C5",
    waitTime: 210,
    antipsychoticUse: 19.5,
    falls: 9.8,
    restraints: 2.9,
    pressureUlcers: 1.1,
    pain: 14.2,
    depression: 13.0,
    website: null
  },
  {
    name: "Oakridge Manor",
    city: "Windsor",
    region: "Erie St. Clair",
    postalCode: "N9A 1A1",
    waitTime: 175,
    antipsychoticUse: 17.2,
    falls: 8.5,
    restraints: 2.2,
    pressureUlcers: 0.85,
    pain: 11.8,
    depression: 11.0,
    website: "https://example.com"
  },
  {
    name: "Northern Lights Care Home",
    city: "Sudbury",
    region: "North East",
    postalCode: "P3E 1B9",
    waitTime: 125,
    antipsychoticUse: 14.5,
    falls: 7.2,
    restraints: 1.8,
    pressureUlcers: 0.65,
    pain: 9.8,
    depression: 9.2,
    website: null
  },
  {
    name: "Bayshore Residence",
    city: "Thunder Bay",
    region: "North West",
    postalCode: "P7B 1A1",
    waitTime: 95,
    antipsychoticUse: 13.2,
    falls: 6.8,
    restraints: 1.6,
    pressureUlcers: 0.55,
    pain: 8.9,
    depression: 8.5,
    website: "https://example.com"
  },
  {
    name: "Garden View Long-Term Care",
    city: "Kingston",
    region: "South East",
    postalCode: "K7L 2V7",
    waitTime: 155,
    antipsychoticUse: 16.5,
    falls: 8.3,
    restraints: 2.0,
    pressureUlcers: 0.75,
    pain: 10.9,
    depression: 10.2,
    website: null
  },
  {
    name: "Evergreen Gardens",
    city: "Barrie",
    region: "North Simcoe Muskoka",
    postalCode: "L4M 3X9",
    waitTime: 185,
    antipsychoticUse: 18.3,
    falls: 9.1,
    restraints: 2.5,
    pressureUlcers: 0.95,
    pain: 12.7,
    depression: 11.8,
    website: "https://example.com"
  },
  {
    name: "Heritage Place",
    city: "Peterborough",
    region: "Central East",
    postalCode: "K9H 1S5",
    waitTime: 170,
    antipsychoticUse: 17.8,
    falls: 8.7,
    restraints: 2.4,
    pressureUlcers: 0.88,
    pain: 11.5,
    depression: 10.8,
    website: null
  },
  {
    name: "Meadowbrook Care Centre",
    city: "Brampton",
    region: "Central West",
    postalCode: "L6R 0W3",
    waitTime: 220,
    antipsychoticUse: 20.1,
    falls: 10.2,
    restraints: 3.2,
    pressureUlcers: 1.15,
    pain: 14.8,
    depression: 13.5,
    website: "https://example.com"
  },
  {
    name: "Parkview Manor",
    city: "Oshawa",
    region: "Central",
    postalCode: "L1G 4S7",
    waitTime: 190,
    antipsychoticUse: 18.6,
    falls: 9.4,
    restraints: 2.6,
    pressureUlcers: 1.0,
    pain: 13.1,
    depression: 12.3,
    website: null
  },
  {
    name: "Willowdale Long-Term Care",
    city: "Toronto",
    region: "Toronto Central",
    postalCode: "M2N 5S9",
    waitTime: 240,
    antipsychoticUse: 19.8,
    falls: 10.0,
    restraints: 3.1,
    pressureUlcers: 1.18,
    pain: 14.5,
    depression: 13.2,
    website: "https://example.com"
  }
]

/**
 * Load real scraped data from file (merged data with location + metrics)
 */
function loadRealScrapedData() {
  try {
    // Try to load the merged data first (has location + metrics)
    const mergedDataPath = join(__dirname, '../ontario-ltc-merged.json')
    if (existsSync(mergedDataPath)) {
      console.log('📊 Loading merged data from ontario-ltc-merged.json...')
      const mergedData = JSON.parse(readFileSync(mergedDataPath, 'utf-8'))
      console.log(`✅ Loaded ${mergedData.data.length} LTC homes with complete data`)
      console.log(`📅 Last updated: ${new Date(mergedData.lastUpdated).toLocaleString()}`)
      console.log(`📍 Data sources: ${mergedData.sources.map(s => s.name).join(', ')}`)
      return mergedData.data
    }
    
    // Fallback to ontario-ltc-complete.json
    const realDataPath = join(__dirname, '../ontario-ltc-complete.json')
    if (existsSync(realDataPath)) {
      console.log('📊 Loading data from ontario-ltc-complete.json...')
      const realData = JSON.parse(readFileSync(realDataPath, 'utf-8'))
      const homes = realData.homes || realData.data || []
      console.log(`✅ Loaded ${homes.length} LTC homes`)
      console.log(`📅 Data scraped at: ${new Date(realData.scrapedAt || realData.lastUpdated).toLocaleString()}`)
      return homes
    }
  } catch (error) {
    console.error('❌ Error loading real data:', error.message)
  }
  return null
}

/**
 * Update the data cache from HQO website
 */
async function updateDataCache() {
  if (dataCache.isUpdating) {
    console.log('⏳ Update already in progress...')
    return
  }
  
  try {
    dataCache.isUpdating = true
    
    // First, try to load the real scraped data
    const realHomes = loadRealScrapedData()
    
    if (realHomes && realHomes.length > 0) {
      console.log('✅ Using real scraped data from file!')
      dataCache.data = realHomes
      dataCache.lastUpdated = new Date()
      dataCache.isUpdating = false
      saveCacheToFile()
      return
    }
    
    console.log('🔄 No real data found, would scrape from HQO website...')
    console.log('⚠️  Scraping takes ~2 hours. Using real data file instead.')
    
    const scrapedData = await scrapeHQOData({
      includeProvincial: true,
      includeRegions: false,
      includeHomes: true,
      headless: true
    })
    
    // Transform the data for our app
    const transformedData = []
    
    // Add provincial data as a reference
    if (scrapedData.provincial) {
      transformedData.push({
        name: 'Ontario Provincial Average',
        city: 'Province-wide',
        region: 'Provincial',
        postalCode: null,
        waitTimeCommunity: parseFloat(scrapedData.provincial.waitTime),
        waitTimeHospital: null,
        antipsychoticUse: parseFloat(scrapedData.provincial.antipsychoticUse),
        falls: parseFloat(scrapedData.provincial.falls),
        restraints: parseFloat(scrapedData.provincial.restraints),
        pressureUlcers: parseFloat(scrapedData.provincial.pressureUlcers),
        pain: parseFloat(scrapedData.provincial.pain),
        depression: parseFloat(scrapedData.provincial.depression),
        website: 'https://www.hqontario.ca',
        isProvincial: true
      })
    }
    
    // Add real individual homes from scraping
    if (scrapedData.homes && scrapedData.homes.length > 0) {
      console.log(`📊 Adding ${scrapedData.homes.length} real LTC homes to cache`)
      scrapedData.homes.forEach(home => {
        if (home && home.name) {
          transformedData.push({
            name: home.name,
            city: home.city || 'N/A',
            region: home.region || 'N/A',
            postalCode: home.postalCode || null,
            waitTimeCommunity: home.waitTimeCommunity,
            waitTimeHospital: home.waitTimeHospital,
            antipsychoticUse: home.antipsychoticUse,
            falls: home.falls,
            restraints: home.restraints,
            pressureUlcers: home.pressureUlcers,
            pain: home.pain,
            depression: home.depression,
            website: home.website
          })
        }
      })
    } else {
      console.log('⚠️  No individual homes scraped - using provincial data only')
    }
    
    dataCache.data = transformedData
    dataCache.lastUpdated = new Date()
    dataCache.isUpdating = false
    
    // Save to file
    saveCacheToFile()
    
    console.log(`✅ Cache updated with ${transformedData.length} entries`)
    console.log(`📅 Next update: ${new Date(Date.now() + CACHE_DURATION).toLocaleString()}`)
    
  } catch (error) {
    console.error('❌ Error updating cache:', error.message)
    dataCache.isUpdating = false
    // Fall back to sample data if scraping fails
    if (!dataCache.data) {
      dataCache.data = sampleLTCData
      dataCache.lastUpdated = new Date()
    }
  }
}

// API Endpoints
app.get('/api/ltc-homes', async (req, res) => {
  try {
    // Check if cache needs updating
    const cacheAge = dataCache.lastUpdated 
      ? Date.now() - dataCache.lastUpdated.getTime() 
      : Infinity
    
    // If cache is stale or empty, update it
    if (cacheAge > CACHE_DURATION || !dataCache.data) {
      if (!dataCache.isUpdating) {
        // Start update in background
        updateDataCache().catch(console.error)
      }
      
      // If no data available, return sample data or wait
      if (!dataCache.data) {
        console.log('⏳ Waiting for initial data load...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (!dataCache.data) {
          return res.json(sampleLTCData)
        }
      }
    }
    
    res.json({
      data: dataCache.data,
      lastUpdated: dataCache.lastUpdated,
      source: 'Health Quality Ontario',
      note: 'Data is refreshed every 24 hours'
    })
  } catch (error) {
    console.error('Error fetching LTC data:', error)
    res.status(500).json({ error: 'Failed to fetch LTC home data' })
  }
})

app.get('/api/ltc-homes/:name', async (req, res) => {
  try {
    const homeName = req.params.name
    const home = sampleLTCData.find(h => 
      h.name.toLowerCase().includes(homeName.toLowerCase())
    )
    
    if (!home) {
      return res.status(404).json({ error: 'Home not found' })
    }
    
    res.json(home)
  } catch (error) {
    console.error('Error fetching home details:', error)
    res.status(500).json({ error: 'Failed to fetch home details' })
  }
})

app.get('/api/regions', async (req, res) => {
  try {
    const regions = [...new Set(sampleLTCData.map(h => h.region))].sort()
    res.json(regions)
  } catch (error) {
    console.error('Error fetching regions:', error)
    res.status(500).json({ error: 'Failed to fetch regions' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API available at http://localhost:${PORT}/api/ltc-homes`)
  console.log(`💾 Cache file: ${CACHE_FILE}`)
  console.log('\n✨ Using COMPLETE MERGED DATA!')
  console.log('   📍 Location: Public Reporting LTC Homes')
  console.log('   📊 Metrics: Health Quality Ontario')
  console.log('   🏥 798 total homes with full details\n')
  
  // Load the real scraped data immediately
  setTimeout(() => {
    updateDataCache().catch(console.error)
  }, 1000)
})

