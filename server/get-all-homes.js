import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

/**
 * Get comprehensive list of LTC homes by searching with common prefixes
 */
async function getAllLTCHomes() {
  console.log('🔍 Discovering All LTC Homes from HQO...\n')
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  })
  
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
  
  const allHomes = new Set()
  
  // Search patterns - common words and letters
  const searchTerms = [
    // Letters A-Z
    ...'abcdefghijklmnopqrstuvwxyz'.split(''),
    // Common words
    'care', 'manor', 'home', 'centre', 'residence', 'villa', 'gardens',
    'park', 'view', 'place', 'lodge', 'house', 'terrace', 'community',
    'saint', 'st', 'mount', 'valley', 'hill', 'meadow', 'creek',
    // Numbers (some homes start with numbers)
    '1', '2', '3', '4', '5'
  ]
  
  console.log(`Searching with ${searchTerms.length} different terms...\n`)
  
  for (let i = 0; i < searchTerms.length; i++) {
    const term = searchTerms[i]
    process.stdout.write(`\r[${i + 1}/${searchTerms.length}] Searching "${term}"... `)
    
    try {
      await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      await page.click('#rdBtnHospital')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Clear and type search term
      await page.click('#HospitalName')
      await page.evaluate(() => {
        document.querySelector('#HospitalName').value = ''
      })
      await page.type('#HospitalName', term, { delay: 50 })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get autocomplete results
      const homes = await page.evaluate(() => {
        const items = document.querySelectorAll('.ui-menu-item')
        return Array.from(items)
          .map(item => item.textContent.trim())
          .filter(text => text && text.length > 0)
      })
      
      homes.forEach(home => allHomes.add(home))
      process.stdout.write(`found ${homes.length} (total: ${allHomes.size})`)
      
    } catch (error) {
      process.stdout.write(`error`)
    }
  }
  
  await browser.close()
  
  const homeList = Array.from(allHomes).sort()
  
  console.log(`\n\n✅ Discovery complete!`)
  console.log(`📊 Found ${homeList.length} unique LTC homes\n`)
  
  // Save to file
  const data = {
    totalHomes: homeList.length,
    discoveredAt: new Date().toISOString(),
    source: 'Health Quality Ontario',
    homes: homeList
  }
  
  writeFileSync('ltc-homes-list.json', JSON.stringify(data, null, 2))
  console.log('💾 Saved to: ltc-homes-list.json')
  
  // Show first 20
  console.log('\n📋 First 20 homes:')
  homeList.slice(0, 20).forEach((home, i) => {
    console.log(`${i + 1}. ${home}`)
  })
  
  if (homeList.length > 20) {
    console.log(`... and ${homeList.length - 20} more`)
  }
  
  return homeList
}

getAllLTCHomes().catch(console.error)

