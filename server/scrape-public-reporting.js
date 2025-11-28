import puppeteer from 'puppeteer'
import fs from 'fs/promises'

const PUBLIC_REPORTING_URL = 'https://publicreporting.ltchomes.net/en-ca/Search_Selection.aspx'

/**
 * Extract detailed home information from the public reporting website
 */
async function scrapeHomeDetails(page, homeName) {
  try {
    // Navigate to the search page
    await page.goto(PUBLIC_REPORTING_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Search for the home
    await page.waitForSelector('#txtSearchString', { timeout: 5000 })
    await page.type('#txtSearchString', homeName, { delay: 50 })
    await page.click('#btnSearch')
    
    // Wait for results to load
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Find and click the exact matching home
    const found = await page.evaluate((searchName) => {
      const links = document.querySelectorAll('a[href*="HomeProfile"]')
      for (const link of links) {
        const text = link.textContent.trim()
        if (text.toUpperCase() === searchName.toUpperCase()) {
          link.click()
          return true
        }
      }
      // If no exact match, click first result
      if (links.length > 0) {
        links[0].click()
        return true
      }
      return false
    }, homeName)
    
    if (!found) {
      return null
    }
    
    // Wait for profile page to load
    await new Promise(resolve => setTimeout(resolve, 3000))
    await page.waitForSelector('.profile-section, table', { timeout: 10000 }).catch(() => {})
    
    // Extract home details
    const homeData = await page.evaluate(() => {
      const data = {}
      
      // Helper function to get text content
      const getText = (selector) => {
        const el = document.querySelector(selector)
        return el ? el.textContent.trim() : null
      }
      
      // Helper to get value from label-value pairs
      const getValueByLabel = (labelText) => {
        const labels = document.querySelectorAll('td, th, label, span, div')
        for (const label of labels) {
          if (label.textContent.trim().includes(labelText)) {
            // Try to find value in next sibling or parent's next sibling
            let value = label.nextElementSibling?.textContent?.trim()
            if (!value) {
              value = label.parentElement?.nextElementSibling?.textContent?.trim()
            }
            if (!value && label.parentElement) {
              // Try to extract from same row
              const row = label.closest('tr')
              if (row) {
                const cells = row.querySelectorAll('td')
                if (cells.length > 1) {
                  value = cells[1]?.textContent?.trim()
                }
              }
            }
            return value || null
          }
        }
        return null
      }
      
      // Extract all table data
      const tables = document.querySelectorAll('table')
      const tableData = {}
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr')
        rows.forEach(row => {
          const cells = row.querySelectorAll('td, th')
          if (cells.length === 2) {
            const key = cells[0].textContent.trim()
            const value = cells[1].textContent.trim()
            if (key && value) {
              tableData[key] = value
            }
          }
        })
      })
      
      // Get home name
      data.name = getText('h1, h2, .home-name, #lblHomeName') || 
                  tableData['Home Name'] ||
                  tableData['LTC Home Name']
      
      // Get address information
      data.address = tableData['Address'] || 
                     tableData['Street Address'] ||
                     getValueByLabel('Address')
      
      data.city = tableData['City'] || 
                  tableData['Municipality'] ||
                  getValueByLabel('City')
      
      data.postalCode = tableData['Postal Code'] || 
                        getValueByLabel('Postal Code')
      
      data.phone = tableData['Phone'] || 
                   tableData['Telephone'] ||
                   getValueByLabel('Phone')
      
      // Get LHIN
      data.lhin = tableData['Local Health Integration Network (LHIN)'] ||
                  tableData['LHIN'] ||
                  tableData['Health Integration Network'] ||
                  getValueByLabel('LHIN') ||
                  getValueByLabel('Local Health Integration Network')
      
      // Get Home, Community and Residential Care
      data.homeCommunityCare = tableData['Home, Community and Residential Care'] ||
                               tableData['Regional Office'] ||
                               getValueByLabel('Home, Community and Residential Care') ||
                               getValueByLabel('Regional Office')
      
      // Get Home Type
      data.homeType = tableData['Home Type'] ||
                      tableData['Type of Home'] ||
                      getValueByLabel('Home Type')
      
      // Get Accreditation
      data.accreditation = tableData['Accreditation'] ||
                          tableData['Accreditation Status'] ||
                          getValueByLabel('Accreditation')
      
      // Get Licensed Beds
      data.licensedBeds = tableData['Licensed Beds'] ||
                         tableData['Number of Licensed Beds'] ||
                         tableData['Total Licensed Beds'] ||
                         getValueByLabel('Licensed Beds')
      
      // Convert licensed beds to number
      if (data.licensedBeds) {
        const match = data.licensedBeds.match(/\d+/)
        if (match) {
          data.licensedBeds = parseInt(match[0])
        }
      }
      
      // Get operator/owner
      data.operator = tableData['Licensee'] ||
                     tableData['Operator'] ||
                     tableData['Owner'] ||
                     getValueByLabel('Licensee') ||
                     getValueByLabel('Operator')
      
      return data
    })
    
    return homeData
    
  } catch (error) {
    console.error(`   ❌ Error scraping ${homeName}:`, error.message)
    return null
  }
}

/**
 * Get all home names from the public reporting site
 */
async function getAllHomeNames(page) {
  console.log('📋 Getting list of all LTC homes from public reporting site...')
  
  try {
    await page.goto(PUBLIC_REPORTING_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Get all home names from the list
    const homes = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="HomeProfile"], ol li, ul li')
      const names = []
      
      links.forEach(link => {
        const text = link.textContent.trim()
        // Filter out empty strings and navigation items
        if (text && text.length > 3 && !text.includes('Skip to') && !text.includes('Home')) {
          names.push(text)
        }
      })
      
      return [...new Set(names)] // Remove duplicates
    })
    
    console.log(`✅ Found ${homes.length} homes`)
    return homes
    
  } catch (error) {
    console.error('❌ Error getting home names:', error.message)
    return []
  }
}

/**
 * Main scraper function
 */
export async function scrapePublicReportingData(options = {}) {
  const {
    homeNames = null,  // If null, will scrape all homes
    headless = true,
    maxHomes = null    // Limit for testing
  } = options
  
  console.log('🚀 Starting Public Reporting LTC scraper...')
  console.log('=' .repeat(50))
  
  let browser
  const results = {
    homes: [],
    scrapedAt: new Date().toISOString(),
    source: 'Public Reporting LTC Homes',
    url: PUBLIC_REPORTING_URL,
    totalAttempted: 0,
    successful: 0,
    failed: 0
  }
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    })
    
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    
    // Get list of homes to scrape
    let homesToScrape = homeNames
    if (!homesToScrape) {
      homesToScrape = await getAllHomeNames(page)
    }
    
    if (maxHomes) {
      homesToScrape = homesToScrape.slice(0, maxHomes)
    }
    
    results.totalAttempted = homesToScrape.length
    
    console.log(`\n📋 Scraping ${homesToScrape.length} homes...`)
    console.log('=' .repeat(50))
    
    // Scrape each home
    for (let i = 0; i < homesToScrape.length; i++) {
      const homeName = homesToScrape[i]
      console.log(`\n[${i + 1}/${homesToScrape.length}] ${homeName}`)
      
      const homeData = await scrapeHomeDetails(page, homeName)
      
      if (homeData && homeData.name) {
        results.homes.push(homeData)
        results.successful++
        console.log(`   ✅ Success - ${homeData.licensedBeds || '?'} beds, ${homeData.city || '?'}`)
      } else {
        results.failed++
        console.log(`   ⚠️  No data extracted`)
      }
      
      // Rate limiting - be respectful
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Progress update every 10 homes
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${homesToScrape.length} (${results.successful} ✅, ${results.failed} ❌)`)
        
        // Save progress periodically
        await fs.writeFile(
          'public-reporting-progress.json',
          JSON.stringify(results, null, 2)
        )
      }
    }
    
    results.completedAt = new Date().toISOString()
    
    console.log('\n✅ Scraping complete!')
    console.log(`   Total attempted: ${results.totalAttempted}`)
    console.log(`   Successful: ${results.successful}`)
    console.log(`   Failed: ${results.failed}`)
    
    return results
    
  } catch (error) {
    console.error('❌ Scraping error:', error.message)
    results.error = error.message
    return results
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Test with a single home if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testHome = process.argv[2] || 'AFTON PARK PLACE LONG TERM CARE COMMUNITY'
  
  scrapePublicReportingData({
    homeNames: [testHome],
    headless: false
  }).then(data => {
    console.log('\n📊 RESULTS:')
    console.log(JSON.stringify(data, null, 2))
    
    // Save results
    fs.writeFile('test-public-reporting.json', JSON.stringify(data, null, 2))
      .then(() => console.log('\n💾 Results saved to test-public-reporting.json'))
      .catch(console.error)
  }).catch(console.error)
}

