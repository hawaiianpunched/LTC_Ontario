import puppeteer from 'puppeteer'

async function simpleTest() {
  console.log('🧪 Simple Test - Weston Terrace Community\n')
  
  const browser = await puppeteer.launch({
    headless: false,  // Show browser so you can see what's happening
    args: ['--no-sandbox'],
    slowMo: 100  // Slow down actions
  })
  
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
  
  console.log('📍 Step 1: Go to HQO website...')
  await page.goto('https://www.hqontario.ca/System-Performance/Long-Term-Care-Home-Performance', {
    waitUntil: 'networkidle2'
  })
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  console.log('📍 Step 2: Click "by Home" tab...')
  await page.click('#rdBtnHospital')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  console.log('📍 Step 3: Focus input and type "weston"...')
  await page.focus('#HospitalName')
  
  // Type slowly and trigger input event
  await page.evaluate(() => {
    const input = document.querySelector('#HospitalName')
    input.value = ''
  })
  
  // Type one character at a time
  const searchTerm = 'weston'
  for (const char of searchTerm) {
    await page.type('#HospitalName', char, { delay: 150 })
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('📍 Step 4: Wait and check for autocomplete...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const autocompleteCheck = await page.evaluate(() => {
    const items = document.querySelectorAll('.ui-menu-item')
    return {
      found: items.length,
      items: Array.from(items).map(el => el.textContent.trim()).slice(0, 5),
      inputValue: document.querySelector('#HospitalName')?.value
    }
  })
  
  console.log('\n📊 Autocomplete results:', JSON.stringify(autocompleteCheck, null, 2))
  
  if (autocompleteCheck.found > 0) {
    console.log('\n✅ Autocomplete working! Clicking first result...')
    await page.evaluate(() => {
      document.querySelectorAll('.ui-menu-item')[0].click()
    })
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    console.log('\n📍 Step 5: Check what data loaded...')
    const data = await page.evaluate(() => {
      return {
        filterName: document.querySelector('#hospital-filter-name')?.textContent?.trim(),
        waitTimeText: document.querySelector('#long-term-care-number')?.textContent?.trim(),
        antipsychoticText: document.querySelector('#second-number')?.textContent?.trim(),
        fallsText: document.querySelector('#third-number')?.textContent?.trim()
      }
    })
    
    console.log('📊 Data found:', JSON.stringify(data, null, 2))
  } else {
    console.log('\n❌ No autocomplete appeared')
  }
  
  console.log('\n🔍 Browser will stay open for 60 seconds for manual inspection...')
  await new Promise(resolve => setTimeout(resolve, 60000))
  
  await browser.close()
}

simpleTest().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})

