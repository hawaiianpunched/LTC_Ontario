import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync, existsSync } from 'fs'

async function scrapeAllComplete() {
  console.log('🚀 Scraping ALL 543 LTC Homes - COMPLETE DATA')
  console.log('=' .repeat(70))
  
  // Load home list
  const homesList = JSON.parse(readFileSync('ltc-homes-list.json', 'utf-8'))
  const allHomes = homesList.homes
  
  console.log(`📊 Total homes: ${allHomes.length}`)
  console.log(`⏱️  Estimated time: 45-60 minutes`)
  console.log(`💾 Saves progress every 25 homes`)
  console.log(`📈 Extracts all 7 metrics per home\n`)
  
  // Resume from existing progress
  let scrapedHomes = []
  let startIndex = 0
  
  if (existsSync('ltc-complete-data.json')) {
    const existing = JSON.parse(readFileSync('ltc-complete-data.json', 'utf-8'))
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
      // Navigate
      await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Click by Home tab
      await page.click('#rdBtnHospital')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Clear and prepare search
      await page.focus('#HospitalName')
      await page.evaluate(() => {
        document.querySelector('#HospitalName').value = ''
      })
      
      // Extract first word for shorter search (more reliable)
      const searchTerm = homeName.split(' ')[0].toLowerCase().substring(0, 15)
      
      // Type slowly for autocomplete
      for (const char of searchTerm) {
        await page.type('#HospitalName', char, { delay: 100 })
        await new Promise(resolve => setTimeout(resolve, 80))
      }
      
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Click matching result
      const clicked = await page.evaluate((fullName) => {
        const items = document.querySelectorAll('.ui-menu-item')
        for (const item of items) {
          if (item.textContent.trim() === fullName) {
            item.click()
            return true
          }
        }
        // Fallback to first if exact match not found
        if (items.length > 0) {
          items[0].click()
          return true
        }
        return false
      }, homeName)
      
      if (!clicked) {
        failCount++
        console.log(`${progress} ${percent}% ❌ No autocomplete results`)
        continue
      }
      
      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Extract complete data
      const homeData = await page.evaluate(() => {
        const getText = (selector) => {
          const el = document.querySelector(selector)
          return el ? el.textContent.trim() : null
        }
        
        const getNumber = (selector) => {
          const text = getText(selector)
          if (!text) return null
          const match = text.match(/[\d.]+/)
          return match ? parseFloat(match[0]) : null
        }
        
        return {
          name: getText('#hospital-filter-name'),
          waitTime: getNumber('#long-term-care-number'),
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
        const short = homeName.length > 40 ? homeName.substring(0, 37) + '...' : homeName
        const metrics = [homeData.waitTime, homeData.antipsychoticUse, homeData.falls, homeData.restraints, homeData.pressureUlcers, homeData.pain, homeData.depression].filter(m => m !== null).length
        console.log(`${progress} ${percent}% ✅ ${short} (${metrics}/7 metrics)`)
      } else {
        failCount++
        console.log(`${progress} ${percent}% ⚠️  ${homeName.substring(0, 40)}... - No data`)
      }
      
    } catch (error) {
      failCount++
      console.log(`${progress} ${percent}% ❌ ${homeName.substring(0, 35)}... - ${error.message.substring(0, 25)}`)
    }
    
    // Save every 25 homes
    if ((i + 1) % 25 === 0) {
      const results = {
        scrapedAt: new Date().toISOString(),
        totalAttempted: i + 1,
        successful: successCount,
        failed: failCount,
        progress: `${i + 1}/${allHomes.length}`,
        homes: scrapedHomes
      }
      writeFileSync('ltc-complete-data.json', JSON.stringify(results, null, 2))
      
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
      const rate = (i + 1 - startIndex) / (Date.now() - startTime) * 1000 * 60
      const remaining = ((allHomes.length - i - 1) / rate).toFixed(1)
      
      console.log(`\n💾 Saved! ${successCount} homes | ${elapsed}min elapsed | ~${remaining}min left\n`)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  await browser.close()
  
  // Final save
  const finalResults = {
    scrapedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    totalAttempted: allHomes.length,
    successful: successCount,
    failed: failCount,
    source: 'Health Quality Ontario',
    url: 'https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance',
    homes: scrapedHomes
  }
  
  writeFileSync('ltc-complete-data.json', JSON.stringify(finalResults, null, 2))
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  
  console.log('\n' + '=' .repeat(70))
  console.log('🎉 SCRAPING COMPLETE!')
  console.log('=' .repeat(70))
  console.log(`📊 Total: ${allHomes.length}`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`⏱️  Time: ${totalTime} minutes`)
  console.log(`💾 Saved: ltc-complete-data.json`)
  
  console.log('\n📋 Sample (first 3):')
  scrapedHomes.slice(0, 3).forEach((home, i) => {
    const metrics = [home.waitTime, home.antipsychoticUse, home.falls, home.restraints, home.pressureUlcers, home.pain, home.depression].filter(m => m !== null).length
    console.log(`${i + 1}. ${home.name} (${metrics}/7 metrics)`)
  })
}

scrapeAllComplete().catch(console.error)

