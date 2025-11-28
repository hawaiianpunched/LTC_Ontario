import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync, existsSync } from 'fs'

async function scrapeAll543Complete() {
  console.log('🚀 Scraping ALL 543 LTC Homes - COMPLETE DATA (8 Metrics)')
  console.log('=' .repeat(70))
  
  const homesList = JSON.parse(readFileSync('ltc-homes-list.json', 'utf-8'))
  const allHomes = homesList.homes
  
  console.log(`📊 Total homes: ${allHomes.length}`)
  console.log(`📈 Metrics per home: 8`)
  console.log(`   - Wait Time (Community)`)
  console.log(`   - Wait Time (Hospital)`)
  console.log(`   - Antipsychotic Use`)
  console.log(`   - Falls`)
  console.log(`   - Physical Restraints`)
  console.log(`   - Pressure Ulcers`)
  console.log(`   - Pain`)
  console.log(`   - Depression`)
  console.log(`⏱️  Estimated time: 50-70 minutes`)
  console.log(`💾 Saves every 25 homes\n`)
  
  // Resume from existing
  let scrapedHomes = []
  let startIndex = 0
  
  if (existsSync('ontario-ltc-complete.json')) {
    const existing = JSON.parse(readFileSync('ontario-ltc-complete.json', 'utf-8'))
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
      
      // Click by Home
      await page.click('#rdBtnHospital')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Clear and search
      await page.focus('#HospitalName')
      await page.evaluate(() => {
        document.querySelector('#HospitalName').value = ''
      })
      
      // Use first word of home name (shorter, more reliable)
      const searchTerm = homeName.split(' ')[0].toLowerCase().substring(0, 15)
      
      // Type slowly
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
        if (items.length > 0) {
          items[0].click()
          return true
        }
        return false
      }, homeName)
      
      if (!clicked) {
        failCount++
        console.log(`${progress} ${percent}% ❌ No autocomplete`)
        continue
      }
      
      // Wait for data
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Extract ALL 8 metrics
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
          waitTimeCommunity: getNumber('#long-term-care-number'),
          waitTimeHospital: getNumber('#long-term-care-number-forhospital'),
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
        
        const metrics = [
          homeData.waitTimeCommunity,
          homeData.waitTimeHospital,
          homeData.antipsychoticUse,
          homeData.falls,
          homeData.restraints,
          homeData.pressureUlcers,
          homeData.pain,
          homeData.depression
        ].filter(m => m !== null).length
        
        const short = homeName.length > 38 ? homeName.substring(0, 35) + '...' : homeName
        console.log(`${progress} ${percent}% ✅ ${short} (${metrics}/8)`)
      } else {
        failCount++
        console.log(`${progress} ${percent}% ⚠️  No data`)
      }
      
    } catch (error) {
      failCount++
      console.log(`${progress} ${percent}% ❌ ${error.message.substring(0, 20)}`)
    }
    
    // Save every 25
    if ((i + 1) % 25 === 0) {
      const results = {
        scrapedAt: new Date().toISOString(),
        totalAttempted: i + 1,
        successful: successCount,
        failed: failCount,
        progress: `${i + 1}/${allHomes.length}`,
        homes: scrapedHomes
      }
      writeFileSync('ontario-ltc-complete.json', JSON.stringify(results, null, 2))
      
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
      const rate = (i + 1 - startIndex) / (Date.now() - startTime) * 1000 * 60
      const remaining = ((allHomes.length - i - 1) / rate).toFixed(1)
      
      console.log(`\n💾 Progress saved! ${successCount} homes | ${elapsed}min / ~${remaining}min\n`)
    }
    
    // Rate limit
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
    metrics: [
      'waitTimeCommunity',
      'waitTimeHospital',
      'antipsychoticUse',
      'falls',
      'restraints',
      'pressureUlcers',
      'pain',
      'depression'
    ],
    homes: scrapedHomes
  }
  
  writeFileSync('ontario-ltc-complete.json', JSON.stringify(finalResults, null, 2))
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  
  console.log('\n' + '=' .repeat(70))
  console.log('🎉 SCRAPING COMPLETE!')
  console.log('=' .repeat(70))
  console.log(`📊 Total: ${allHomes.length}`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`⏱️  Time: ${totalTime} minutes`)
  console.log(`💾 File: ontario-ltc-complete.json`)
  
  console.log('\n📋 Sample (first 2):')
  scrapedHomes.slice(0, 2).forEach((home, i) => {
    console.log(`\n${i + 1}. ${home.name}`)
    console.log(`   Wait (Community): ${home.waitTimeCommunity} days`)
    console.log(`   Wait (Hospital): ${home.waitTimeHospital} days`)
    console.log(`   Antipsychotic: ${home.antipsychoticUse}%`)
  })
}

scrapeAll543Complete().catch(console.error)

