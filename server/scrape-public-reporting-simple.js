import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs/promises'
import https from 'https'

// Create axios instance with SSL workaround
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const PUBLIC_REPORTING_BASE = 'https://publicreporting.ltchomes.net/en-ca'
const SEARCH_URL = `${PUBLIC_REPORTING_BASE}/Search_Selection.aspx`

/**
 * Get all home names and their profile links
 */
async function getAllHomes() {
  console.log('📋 Fetching list of all LTC homes...')
  
  try {
    const response = await axiosInstance.get(SEARCH_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    const homes = []
    
    // Find all home links - they use lowercase "homeprofile.aspx"
    // The homes are in the second OL list (first is navigation)
    $('a[href*="homeprofile.aspx"]').each((i, el) => {
      const $link = $(el)
      const name = $link.text().trim()
      const href = $link.attr('href')
      
      if (name && href && name.length > 5) {
        homes.push({
          name: name,
          url: href.startsWith('http') ? href : `${PUBLIC_REPORTING_BASE}/${href}`
        })
      }
    })
    
    console.log(`✅ Found ${homes.length} homes`)
    return homes
    
  } catch (error) {
    console.error('❌ Error fetching home list:', error.message)
    return []
  }
}

/**
 * Scrape detailed information for a single home
 */
async function scrapeHomeProfile(homeUrl, homeName) {
  try {
    const response = await axiosInstance.get(homeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 15000
    })
    
    const $ = cheerio.load(response.data)
    const data = { name: homeName }
    
    // Extract basic info from header section
    data.name = $('#ctl00_ContentPlaceHolder1_divHomeName').text().trim() || data.name
    data.address = $('#ctl00_ContentPlaceHolder1_divHomeAddress').text().trim() || null
    
    // Extract city and postal code
    const cityPostal = $('#ctl00_ContentPlaceHolder1_divHomeCity').text().trim()
    if (cityPostal) {
      // Format is "City, PostalCode"
      const parts = cityPostal.split(',').map(s => s.trim())
      if (parts.length === 2) {
        data.city = parts[0]
        data.postalCode = parts[1]
      } else {
        data.city = cityPostal
      }
    }
    
    // Extract phone
    const phoneText = $('#ctl00_ContentPlaceHolder1_divHomePhone').text().trim()
    if (phoneText) {
      data.phone = phoneText.replace('Tel : ', '').trim()
    }
    
    // Extract fax
    const faxText = $('#ctl00_ContentPlaceHolder1_divHomeFax').text().trim()
    if (faxText) {
      data.fax = faxText.replace('Fax : ', '').trim()
    }
    
    // Extract website
    const websiteLink = $('#ctl00_ContentPlaceHolder1_divHomeWebsite a')
    if (websiteLink.length > 0) {
      data.website = websiteLink.attr('href')
    }
    
    // Extract profile data from the structured rows
    $('.Profilerow, .Profilerow_alternate').each((i, row) => {
      const $row = $(row)
      const label = $row.find('.Profilerow_col1').text().trim()
      const value = $row.find('.Profilerow_col2').text().trim()
      
      if (!label || !value) return
      
      // Map labels to data fields
      const labelLower = label.toLowerCase()
      
      if (label.includes('Local Health Integration Network')) {
        data.lhin = value
      } else if (label.includes('Home, Community and Residential Care')) {
        data.homeCommunityCare = value
      } else if (label === 'Home Administrator') {
        data.homeAdministrator = value.trim()
      } else if (label === 'Licensee') {
        data.licensee = value
      } else if (label === 'Management Firm' && value) {
        data.managementFirm = value
      } else if (label === 'Home Type') {
        data.homeType = value
      } else if (label === 'Licensed Beds') {
        // Extract number from "Home with approximately 128 beds"
        const match = value.match(/\d+/)
        data.licensedBeds = match ? parseInt(match[0]) : null
        data.licensedBedsText = value
      } else if (label === 'Approved Short Stay Beds') {
        data.approvedShortStayBeds = value
      } else if (label === "Residents' Council") {
        data.residentsCouncil = value
      } else if (label === 'Family Council') {
        data.familyCouncil = value
      } else if (label === 'Accreditation') {
        data.accreditation = value
      } else if (label.includes('French Language Services')) {
        data.frenchLanguageServices = value
      }
    })
    
    // Clean up the data
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = data[key].replace(/\s+/g, ' ').trim()
        if (data[key] === '' || data[key] === '-') {
          data[key] = null
        }
      }
    })
    
    return data
    
  } catch (error) {
    console.error(`   ❌ Error scraping ${homeName}:`, error.message)
    return { name: homeName, error: error.message }
  }
}

/**
 * Main scraper function
 */
export async function scrapePublicReportingData(options = {}) {
  const {
    maxHomes = null,    // Limit for testing
    delay = 500         // Delay between requests in ms
  } = options
  
  console.log('🚀 Starting Public Reporting LTC scraper (Simple)...')
  console.log('=' .repeat(50))
  
  const results = {
    homes: [],
    scrapedAt: new Date().toISOString(),
    source: 'Public Reporting LTC Homes',
    url: SEARCH_URL,
    totalAttempted: 0,
    successful: 0,
    failed: 0
  }
  
  try {
    // Get list of all homes
    const homeList = await getAllHomes()
    
    let homesToScrape = homeList
    if (maxHomes) {
      homesToScrape = homeList.slice(0, maxHomes)
    }
    
    results.totalAttempted = homesToScrape.length
    
    console.log(`\n📋 Scraping ${homesToScrape.length} homes...`)
    console.log('=' .repeat(50))
    
    // Scrape each home
    for (let i = 0; i < homesToScrape.length; i++) {
      const home = homesToScrape[i]
      console.log(`\n[${i + 1}/${homesToScrape.length}] ${home.name}`)
      
      const homeData = await scrapeHomeProfile(home.url, home.name)
      
      if (homeData && !homeData.error) {
        results.homes.push(homeData)
        results.successful++
        
        // Show what we got
        const details = []
        if (homeData.city) details.push(homeData.city)
        if (homeData.licensedBeds) details.push(`${homeData.licensedBeds} beds`)
        if (homeData.lhin) details.push(homeData.lhin)
        
        console.log(`   ✅ ${details.join(', ') || 'Success'}`)
      } else {
        results.failed++
        console.log(`   ⚠️  Failed to extract data`)
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Progress update and save every 25 homes
      if ((i + 1) % 25 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${homesToScrape.length} (${results.successful} ✅, ${results.failed} ❌)`)
        
        // Save progress
        await fs.writeFile(
          'public-reporting-progress.json',
          JSON.stringify(results, null, 2)
        ).catch(err => console.error('Failed to save progress:', err.message))
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
    results.completedAt = new Date().toISOString()
    return results
  }
}

// Test with first few homes if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const maxHomes = parseInt(process.argv[2]) || 3
  
  scrapePublicReportingData({
    maxHomes: maxHomes,
    delay: 500
  }).then(data => {
    console.log('\n📊 RESULTS:')
    console.log(JSON.stringify(data, null, 2))
    
    // Save results
    fs.writeFile('public-reporting-simple-test.json', JSON.stringify(data, null, 2))
      .then(() => console.log('\n💾 Results saved to public-reporting-simple-test.json'))
      .catch(console.error)
  }).catch(console.error)
}

