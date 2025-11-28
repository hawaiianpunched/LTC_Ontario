import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync, existsSync } from 'fs'

async function scrapeAllHomes() {
  console.log('🚀 Scraping ALL 543 LTC Homes from Health Quality Ontario')
  console.log('=' .repeat(70))
  
  // Load the home list
  const homesList = JSON.parse(readFileSync('ltc-homes-list.json', 'utf-8'))
  const allHomes = homesList.homes
  
  console.log(`📊 Total homes to scrape: ${allHomes.length}`)
  console.log(`⏱️  Estimated time: 30-45 minutes`)
  console.log(`💾 Progress will be saved every 25 homes`)
  console.log(`🔄 You can stop and resume anytime\n`)
  
  // Check if we have existing progress
  let scrapedHomes = []
  let startIndex = 0
  
  if (existsSync('scraped-all-homes.json')) {
    const existing = JSON.parse(readFileSync('scraped-all-homes.json', 'utf-8'))
    scrapedHomes = existing.homes || []
    startIndex = scrapedHomes.length
    console.log(`📥 Resuming from home #${startIndex + 1}\n`)
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
  
  let successCount = scrapedHomes.length
  let failCount = 0
  const startTime = Date.now()
  
  for (let i = startIndex; i < allHomes.length; i++) {
    const homeName = allHomes[i]
    const progress = `[${i + 1}/${allHomes.length}]`
    const percent = ((i + 1) / allHomes.length * 100).toFixed(1)
    
    try {
      // Navigate to page
      await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Click "by Home" tab
      await page.click('#rdBtnHospital')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Search for home
      await page.click('#HospitalName')
      await page.evaluate(() => {
        document.querySelector('#HospitalName').value = ''
      })
      
      // Type more slowly for reliability
      await page.type('#HospitalName', homeName, { delay: 50 })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Wait for autocomplete
      await page.waitForSelector('.ui-menu-item', { timeout: 5000 })
      
      // Click matching result
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
        failCount++
        console.log(`${progress} ${percent}% ❌ No results`)
        continue
      }
      
      // Wait for data to load - give it more time
      await new Promise(resolve => setTimeout(resolve, 3500))
      
      // Wait for specific data element
      await page.waitForSelector('#dynamicIndividualHospitalName', { timeout: 5000 }).catch(() => {})
      
      // Extract data
      const homeData = await page.evaluate(() => {
        const getData = (selector) => {
          const element = document.querySelector(selector)
          if (!element) return null
          const text = element.textContent.trim()
          return text && text !== '' ? text : null
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
        const shortName = homeName.length > 45 ? homeName.substring(0, 42) + '...' : homeName
        console.log(`${progress} ${percent}% ✅ ${shortName}`)
      } else {
        failCount++
        console.log(`${progress} ${percent}% ⚠️  No data extracted`)
      }
      
    } catch (error) {
      failCount++
      console.log(`${progress} ${percent}% ❌ ${error.message.substring(0, 30)}`)
    }
    
    // Save progress every 25 homes
    if ((i + 1) % 25 === 0) {
      const results = {
        scrapedAt: new Date().toISOString(),
        totalAttempted: i + 1,
        successful: successCount,
        failed: failCount,
        progress: `${i + 1}/${allHomes.length}`,
        homes: scrapedHomes
      }
      writeFileSync('scraped-all-homes.json', JSON.stringify(results, null, 2))
      
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
      const rate = (i + 1 - startIndex) / (Date.now() - startTime) * 1000 * 60
      const remaining = ((allHomes.length - i - 1) / rate).toFixed(1)
      
      console.log(`\n💾 Progress saved! ${successCount} homes | ${elapsed}min elapsed | ~${remaining}min remaining\n`)
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 800))
  }
  
  await browser.close()
  
  // Final save
  const finalResults = {
    scrapedAt: new Date().toISOString(),
    totalAttempted: allHomes.length,
    successful: successCount,
    failed: failCount,
    completedAt: new Date().toISOString(),
    homes: scrapedHomes
  }
  
  writeFileSync('scraped-all-homes.json', JSON.stringify(finalResults, null, 2))
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  
  console.log('\n' + '=' .repeat(70))
  console.log('🎉 SCRAPING COMPLETE!')
  console.log('=' .repeat(70))
  console.log(`📊 Total attempted: ${allHomes.length}`)
  console.log(`✅ Successfully scraped: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`⏱️  Total time: ${totalTime} minutes`)
  console.log(`💾 Saved to: scraped-all-homes.json`)
  
  // Show sample
  if (scrapedHomes.length > 0) {
    console.log('\n📋 Sample Data (first 5 homes):')
    scrapedHomes.slice(0, 5).forEach((home, i) => {
      console.log(`\n${i + 1}. ${home.name}`)
      console.log(`   📍 ${home.city}, ${home.region}`)
      console.log(`   ⏱️  Wait: ${home.waitTime || 'N/A'} days`)
      console.log(`   💊 Antipsychotic: ${home.antipsychoticUse || 'N/A'}%`)
      console.log(`   ⚠️  Falls: ${home.falls || 'N/A'}%`)
    })
  }
  
  console.log('\n✅ Ready to integrate into your app!')
}

scrapeAllHomes().catch(console.error)

