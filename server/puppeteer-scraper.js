import puppeteer from 'puppeteer'

const HQO_LTC_URL = 'https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance'

// LHIN Regions mapping
const LHIN_REGIONS = {
  '08': 'Central',
  '09': 'Central East',
  '05': 'Central West',
  '11': 'Champlain',
  '01': 'Erie St. Clair',
  '04': 'Hamilton Niagara Haldimand Brant',
  '06': 'Mississauga Halton',
  '13': 'North East',
  '12': 'North Simcoe Muskoka',
  '14': 'North West',
  '10': 'South East',
  '02': 'South West',
  '07': 'Toronto Central',
  '03': 'Waterloo Wellington'
}

/**
 * Extract provincial LTC data from the page
 */
async function extractProvincialData(page) {
  console.log('📊 Extracting provincial data...')
  
  // Wait for data to load
  await page.waitForSelector('#long-term-care-number', { timeout: 10000 })
  await new Promise(resolve => setTimeout(resolve, 2000)) // Extra wait for all data
  
  const data = await page.evaluate(() => {
    const getData = (selector) => {
      const element = document.querySelector(selector)
      if (!element) return null
      const text = element.textContent.trim()
      // Extract numbers from text
      const match = text.match(/[\d.]+/)
      return match ? match[0] : text
    }
    
    return {
      waitTime: getData('#long-term-care-number'),
      antipsychoticUse: getData('#second-number'),
      falls: getData('#third-number'),
      restraints: getData('#fourth-number'),
      pressureUlcers: getData('#fifth-number'),
      pain: getData('#sixth-number'),
      depression: getData('#seventh-number')
    }
  })
  
  console.log('✅ Provincial data:', data)
  return data
}

/**
 * Extract data for a specific region
 */
async function extractRegionData(page, regionId, regionName) {
  console.log(`\n📍 Extracting data for ${regionName}...`)
  
  try {
    // Click on "by Region" tab
    await page.click('#rdBtnLHIN')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Select the region
    await page.select('#selectLHIN', regionId)
    await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for data to load
    
    // Extract the data
    const data = await page.evaluate(() => {
      const getData = (selector) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const text = element.textContent.trim()
        const match = text.match(/[\d.]+/)
        return match ? match[0] : text
      }
      
      return {
        waitTime: getData('#long-term-care-number'),
        antipsychoticUse: getData('#second-number'),
        falls: getData('#third-number'),
        restraints: getData('#fourth-number'),
        pressureUlcers: getData('#fifth-number'),
        pain: getData('#sixth-number'),
        depression: getData('#seventh-number')
      }
    })
    
    console.log(`✅ ${regionName} data:`, data)
    return { region: regionName, regionId, ...data }
    
  } catch (error) {
    console.error(`❌ Error extracting ${regionName}:`, error.message)
    return null
  }
}

/**
 * Search for individual homes
 */
async function searchHome(page, homeName) {
  console.log(`🔍 ${homeName}`)
  
  try {
    // Navigate fresh to the page
    await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Click on "by Home" tab
    await page.click('#rdBtnHospital')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Clear and type in the search box
    await page.click('#HospitalName')
    await page.evaluate(() => {
      document.querySelector('#HospitalName').value = ''
    })
    await page.type('#HospitalName', homeName, { delay: 50 })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Wait for autocomplete results and click matching item
    await page.waitForSelector('.ui-menu-item', { timeout: 5000 })
    
    // Find and click the exact matching item
    const clicked = await page.evaluate((searchName) => {
      const items = document.querySelectorAll('.ui-menu-item')
      for (const item of items) {
        if (item.textContent.trim() === searchName) {
          item.click()
          return true
        }
      }
      // If exact match not found, click first item
      if (items.length > 0) {
        items[0].click()
        return true
      }
      return false
    }, homeName)
    
    if (!clicked) {
      console.log(`   ⚠️  No results found`)
      return null
    }
    
    // Wait for data to load
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Extract home details
    const homeData = await page.evaluate(() => {
      const getData = (selector) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const text = element.textContent.trim()
        return text || null
      }
      
      const getNumber = (selector) => {
        const text = getData(selector)
        if (!text) return null
        const match = text.match(/[\d.]+/)
        return match ? parseFloat(match[0]) : null
      }
      
      return {
        name: getData('#dynamicIndividualHospitalName'),
        city: getData('#dynamicIndividualHospitalCity'),
        postalCode: getData('#dynamicIndividualHospitalPostalCode'),
        region: getData('#dynamicIndividualHospitalLHIN'),
        website: document.querySelector('#dynamicIndividualHospitalWebsite')?.href || null,
        waitTime: getNumber('#long-term-care-number-forhospital') || getNumber('#long-term-care-number'),
        antipsychoticUse: getNumber('#second-number'),
        falls: getNumber('#third-number'),
        restraints: getNumber('#fourth-number'),
        pressureUlcers: getNumber('#fifth-number'),
        pain: getNumber('#sixth-number'),
        depression: getNumber('#seventh-number')
      }
    })
    
    if (homeData.name) {
      console.log(`   ✅ ${homeData.city || 'N/A'} - ${homeData.region || 'N/A'}`)
      return homeData
    } else {
      console.log(`   ⚠️  No data extracted`)
      return null
    }
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return null
  }
}

/**
 * Get all available home names from autocomplete
 */
async function getAllHomeNames(page) {
  console.log('\n📋 Getting list of all LTC homes...')
  
  try {
    // Navigate to the page fresh
    await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
      waitUntil: 'networkidle2'
    })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Click on "by Home" tab
    await page.click('#rdBtnHospital')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Clear any existing text and focus on search input
    await page.click('#HospitalName')
    await page.evaluate(() => {
      document.querySelector('#HospitalName').value = ''
    })
    
    // Type a single character to trigger full autocomplete list
    await page.type('#HospitalName', 'a', { delay: 100 })
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get all autocomplete suggestions
    const homes = await page.evaluate(() => {
      const items = document.querySelectorAll('.ui-menu-item')
      return Array.from(items).map(item => {
        const text = item.textContent.trim()
        return text
      }).filter(name => name && name.length > 0)
    })
    
    console.log(`✅ Found ${homes.length} homes in autocomplete`)
    
    // If we didn't get many, try with different letters to get more
    if (homes.length < 50) {
      console.log('🔄 Trying additional searches to find more homes...')
      const allHomes = new Set(homes)
      
      const letters = ['b', 'c', 'd', 'e', 'm', 's', 't', 'w']
      for (const letter of letters) {
        await page.evaluate(() => {
          document.querySelector('#HospitalName').value = ''
        })
        await page.type('#HospitalName', letter, { delay: 100 })
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const moreHomes = await page.evaluate(() => {
          const items = document.querySelectorAll('.ui-menu-item')
          return Array.from(items).map(item => item.textContent.trim()).filter(n => n)
        })
        
        moreHomes.forEach(home => allHomes.add(home))
        console.log(`   Found ${moreHomes.length} homes starting with "${letter}"`)
      }
      
      const finalList = Array.from(allHomes)
      console.log(`✅ Total unique homes found: ${finalList.length}`)
      return finalList
    }
    
    return homes
    
  } catch (error) {
    console.error('❌ Error getting home names:', error.message)
    return []
  }
}

/**
 * Main scraper function
 */
export async function scrapeHQOData(options = {}) {
  const { 
    includeProvincial = true,
    includeRegions = true,
    includeHomes = false,
    headless = true 
  } = options
  
  console.log('🚀 Starting HQO LTC data scraper...')
  console.log('=' .repeat(50))
  
  let browser
  const results = {
    provincial: null,
    regions: [],
    homes: [],
    scrapedAt: new Date().toISOString()
  }
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    
    console.log('🌐 Navigating to HQO website...')
    await page.goto(HQO_LTC_URL, { waitUntil: 'networkidle2', timeout: 30000 })
    
    // Extract provincial data
    if (includeProvincial) {
      results.provincial = await extractProvincialData(page)
    }
    
    // Extract regional data
    if (includeRegions) {
      for (const [regionId, regionName] of Object.entries(LHIN_REGIONS)) {
        const regionData = await extractRegionData(page, regionId, regionName)
        if (regionData) {
          results.regions.push(regionData)
        }
        await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
      }
    }
    
    // Extract individual home data
    if (includeHomes) {
      const homeNames = await getAllHomeNames(page)
      console.log(`\n📋 Scraping ${homeNames.length} individual homes...`)
      console.log('=' .repeat(50))
      
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < homeNames.length; i++) {
        const homeName = homeNames[i]
        console.log(`\n[${i + 1}/${homeNames.length}] ${homeName}`)
        
        const homeData = await searchHome(page, homeName)
        if (homeData && homeData.name) {
          results.homes.push(homeData)
          successCount++
        } else {
          failCount++
        }
        
        // Rate limiting - be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        // Progress update every 10 homes
        if ((i + 1) % 10 === 0) {
          console.log(`\n📊 Progress: ${i + 1}/${homeNames.length} processed (${successCount} successful, ${failCount} failed)`)
        }
      }
      
      console.log(`\n✅ Home scraping complete!`)
      console.log(`   Total homes: ${homeNames.length}`)
      console.log(`   Successfully scraped: ${successCount}`)
      console.log(`   Failed: ${failCount}`)
    }
    
    console.log('\n✅ Scraping complete!')
    return results
    
  } catch (error) {
    console.error('❌ Scraping error:', error.message)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Test the scraper if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeHQOData({
    includeProvincial: true,
    includeRegions: false,
    includeHomes: false,
    headless: false // Set to true for production
  }).then(data => {
    console.log('\n📊 RESULTS:')
    console.log(JSON.stringify(data, null, 2))
  }).catch(console.error)
}

