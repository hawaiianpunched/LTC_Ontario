import { scrapePublicReportingData } from './scrape-public-reporting-simple.js'
import fs from 'fs/promises'

console.log('🚀 Starting full scrape of all 686 LTC homes...')
console.log('⏱️  Estimated time: ~20-30 minutes (with 500ms delay between requests)')
console.log('=' .repeat(50))

scrapePublicReportingData({
  maxHomes: null,  // Scrape all homes
  delay: 500       // 500ms delay between requests
}).then(async (results) => {
  console.log('\n' + '=' .repeat(50))
  console.log('✅ SCRAPING COMPLETE!')
  console.log('=' .repeat(50))
  console.log(`Total homes scraped: ${results.successful}`)
  console.log(`Failed: ${results.failed}`)
  
  // Save results
  const filename = 'public-reporting-all-homes.json'
  await fs.writeFile(filename, JSON.stringify(results, null, 2))
  console.log(`\n💾 Results saved to ${filename}`)
  
  // Show summary stats
  const homes = results.homes
  const withLHIN = homes.filter(h => h.lhin).length
  const withBeds = homes.filter(h => h.licensedBeds).length
  const withAddress = homes.filter(h => h.address && h.city).length
  const withAccreditation = homes.filter(h => h.accreditation === 'Yes').length
  
  console.log('\n📊 Data Quality Summary:')
  console.log(`  Homes with LHIN: ${withLHIN} (${(withLHIN/homes.length*100).toFixed(1)}%)`)
  console.log(`  Homes with Licensed Beds: ${withBeds} (${(withBeds/homes.length*100).toFixed(1)}%)`)
  console.log(`  Homes with Address: ${withAddress} (${(withAddress/homes.length*100).toFixed(1)}%)`)
  console.log(`  Homes with Accreditation: ${withAccreditation} (${(withAccreditation/homes.length*100).toFixed(1)}%)`)
  
  // Show breakdown by Home Type
  const byType = {}
  homes.forEach(h => {
    const type = h.homeType || 'Unknown'
    byType[type] = (byType[type] || 0) + 1
  })
  
  console.log('\n🏥 Homes by Type:')
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
  
  // Show breakdown by LHIN
  const byLHIN = {}
  homes.forEach(h => {
    const lhin = h.lhin || 'Unknown'
    byLHIN[lhin] = (byLHIN[lhin] || 0) + 1
  })
  
  console.log('\n📍 Homes by LHIN:')
  Object.entries(byLHIN).sort((a, b) => b[1] - a[1]).forEach(([lhin, count]) => {
    console.log(`  ${lhin}: ${count}`)
  })
  
}).catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

