import fs from 'fs/promises'
import { mergeLTCData } from './merge-ltc-data.js'

const PROGRESS_FILE = 'public-reporting-progress.json'
const FINAL_FILE = 'public-reporting-all-homes.json'
const CHECK_INTERVAL = 10000 // Check every 10 seconds

let lastReportedProgress = 0

async function checkProgress() {
  try {
    // Check if final file exists
    try {
      await fs.access(FINAL_FILE)
      console.log('\n✅ Scraping complete! Final file found.')
      return 'complete'
    } catch {
      // File doesn't exist yet
    }
    
    // Check progress file
    try {
      const progressData = await fs.readFile(PROGRESS_FILE, 'utf8')
      const progress = JSON.parse(progressData)
      
      const current = progress.successful + progress.failed
      const total = progress.totalAttempted
      const percent = ((current / total) * 100).toFixed(1)
      
      // Only report if progress has changed
      if (current !== lastReportedProgress) {
        console.log(`📊 Progress: ${current}/${total} (${percent}%) - ✅ ${progress.successful} successful, ❌ ${progress.failed} failed`)
        lastReportedProgress = current
      }
      
      // Check if complete
      if (progress.completedAt) {
        console.log('\n✅ Scraping complete! (Found completedAt in progress file)')
        return 'complete'
      }
      
      return 'in_progress'
    } catch (error) {
      // Progress file doesn't exist yet
      if (lastReportedProgress === 0) {
        console.log('⏳ Waiting for scrape to start...')
        lastReportedProgress = -1 // Mark as reported
      }
      return 'not_started'
    }
  } catch (error) {
    console.error('Error checking progress:', error.message)
    return 'error'
  }
}

async function waitForCompletion() {
  console.log('🔍 Monitoring scrape progress...')
  console.log('=' .repeat(50))
  
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const status = await checkProgress()
      
      if (status === 'complete') {
        clearInterval(interval)
        resolve()
      } else if (status === 'error') {
        clearInterval(interval)
        reject(new Error('Error during progress check'))
      }
    }, CHECK_INTERVAL)
  })
}

// Main execution
console.log('🚀 LTC Data Monitor & Merger')
console.log('=' .repeat(50))

waitForCompletion()
  .then(async () => {
    console.log('\n' + '=' .repeat(50))
    console.log('🔗 Starting data merge...')
    console.log('=' .repeat(50))
    
    // Wait a moment for file to be fully written
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Run the merge
    await mergeLTCData()
    
    console.log('\n' + '=' .repeat(50))
    console.log('✨ ALL COMPLETE!')
    console.log('=' .repeat(50))
    console.log('\n📄 Files created:')
    console.log('  • ontario-ltc-merged.json (complete merged dataset)')
    console.log('  • ontario-ltc-complete.json (updated with new data)')
    console.log('  • public-reporting-all-homes.json (raw scraped data)')
    
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  })

