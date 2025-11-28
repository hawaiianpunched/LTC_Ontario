import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync } from 'fs'

async function scrape50Homes() {
  console.log('🚀 Scraping First 50 LTC Homes')
  console.log('=' .repeat(60))
  
  // Load the home list we discovered
  const homesList = JSON.parse(readFileSync('ltc-homes-list.json', 'utf-8'))
  const homesToScrape = homesList.homes.slice(0, 50)
  
  console.log(`📊 Total homes available: ${homesList.homes.length}`)
  console.log(`🎯 Scraping first: ${homesToScrape.length}`)
  console.log(`⏱️  Estimated time: ~5 minutes\n`)
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
  
  const scrapedHomes = []
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < homesToScrape.length; i++) {
    const homeName = homesToScrape[i]
    const progress = `[${i + 1}/${homesToScrape.length}]`
    
    try {
      // Navigate to page
      await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Click "by Home" tab
      await page.click('#rdBtnHospital')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Search for home
      await page.click('#HospitalName')
      await page.evaluate(() => {
        document.querySelector('#HospitalName').value = ''
      })
      await page.type('#HospitalName', homeName, { delay: 30 })
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Click first result
      const clicked = await page.evaluate((searchName) => {
        const items = document.querySelectorAll('.ui-menu-item')
        for (const item of items) {
          if (item.textContent.trim() === searchName) {
            item.click()
            return true
          }
        }
        if (items.length > 0) {
          items[0].click()
          return true
        }
        return false
      }, homeName)
      
      if (!clicked) {
        console.log(`${progress} ❌ ${homeName.substring(0, 50)}... - No results`)
        failCount++
        continue
      }
      
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Extract data
      const homeData = await page.evaluate(() => {
        const getData = (selector) => {
          const element = document.querySelector(selector)
          if (!element) return null
          return element.textContent.trim() || null
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
        scrapedHomes.push(homeData)
        successCount++
        const shortName = homeName.length > 50 ? homeName.substring(0, 47) + '...' : homeName
        console.log(`${progress} ✅ ${shortName}`)
      } else {
        console.log(`${progress} ⚠️  ${homeName.substring(0, 50)}... - No data`)
        failCount++
      }
      
    } catch (error) {
      console.log(`${progress} ❌ ${homeName.substring(0, 50)}... - ${error.message}`)
      failCount++
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  await browser.close()
  
  // Save results
  const results = {
    scrapedAt: new Date().toISOString(),
    totalAttempted: homesToScrape.length,
    successful: successCount,
    failed: failCount,
    homes: scrapedHomes
  }
  
  writeFileSync('scraped-50-homes.json', JSON.stringify(results, null, 2))
  
  console.log('\n' + '=' .repeat(60))
  console.log('✅ SCRAPING COMPLETE!')
  console.log('=' .repeat(60))
  console.log(`📊 Attempted: ${homesToScrape.length}`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`💾 Saved to: scraped-50-homes.json`)
  
  // Show sample data
  if (scrapedHomes.length > 0) {
    console.log('\n📋 Sample Data (first 3 homes):')
    scrapedHomes.slice(0, 3).forEach((home, i) => {
      console.log(`\n${i + 1}. ${home.name}`)
      console.log(`   City: ${home.city}`)
      console.log(`   Region: ${home.region}`)
      console.log(`   Wait Time: ${home.waitTime} days`)
      console.log(`   Antipsychotic: ${home.antipsychoticUse}%`)
      console.log(`   Falls: ${home.falls}%`)
    })
  }
}

scrape50Homes().catch(console.error)

