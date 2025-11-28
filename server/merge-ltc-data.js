import fs from 'fs/promises'

/**
 * Merge the HQO quality metrics data with the Public Reporting location/details data
 */
async function mergeLTCData() {
  console.log('🔄 Merging LTC data from multiple sources...')
  console.log('=' .repeat(50))
  
  try {
    // Load existing HQO data (quality metrics)
    console.log('📊 Loading quality metrics data (ontario-ltc-complete.json)...')
    const hqoData = JSON.parse(await fs.readFile('ontario-ltc-complete.json', 'utf8'))
    const hqoHomes = hqoData.homes || []
    console.log(`  Found ${hqoHomes.length} homes with quality metrics`)
    
    // Load public reporting data (location/details)
    console.log('📍 Loading location/details data (public-reporting-all-homes.json)...')
    const prData = JSON.parse(await fs.readFile('public-reporting-all-homes.json', 'utf8'))
    const prHomes = prData.homes || []
    console.log(`  Found ${prHomes.length} homes with location data`)
    
    // Create a map of public reporting data by home name
    const prMap = new Map()
    prHomes.forEach(home => {
      // Normalize name for matching
      const normalizedName = home.name.toUpperCase().trim()
      prMap.set(normalizedName, home)
    })
    
    // Merge the data
    console.log('\n🔗 Merging data...')
    const mergedHomes = []
    let matchCount = 0
    let noMatchCount = 0
    
    hqoHomes.forEach(hqoHome => {
      const normalizedName = hqoHome.name.toUpperCase().trim()
      const prHome = prMap.get(normalizedName)
      
      if (prHome) {
        // Merge the data - HQO metrics + PR details
        const merged = {
          name: hqoHome.name,  // Use original name from HQO
          
          // Location data from Public Reporting
          address: prHome.address,
          city: prHome.city,
          postalCode: prHome.postalCode,
          phone: prHome.phone,
          fax: prHome.fax,
          website: prHome.website,
          
          // Administrative data from Public Reporting
          lhin: prHome.lhin,
          homeCommunityCare: prHome.homeCommunityCare,
          homeAdministrator: prHome.homeAdministrator,
          licensee: prHome.licensee,
          managementFirm: prHome.managementFirm,
          homeType: prHome.homeType,
          licensedBeds: prHome.licensedBeds,
          approvedShortStayBeds: prHome.approvedShortStayBeds,
          residentsCouncil: prHome.residentsCouncil,
          familyCouncil: prHome.familyCouncil,
          accreditation: prHome.accreditation,
          frenchLanguageServices: prHome.frenchLanguageServices,
          
          // Quality metrics from HQO
          waitTimeCommunity: hqoHome.waitTimeCommunity,
          waitTimeHospital: hqoHome.waitTimeHospital,
          antipsychoticUse: hqoHome.antipsychoticUse,
          falls: hqoHome.falls,
          restraints: hqoHome.restraints,
          pressureUlcers: hqoHome.pressureUlcers,
          pain: hqoHome.pain,
          depression: hqoHome.depression,
          
          // Legacy fields if they exist
          region: prHome.city,  // For backward compatibility
          isProvincial: hqoHome.isProvincial
        }
        
        mergedHomes.push(merged)
        matchCount++
      } else {
        // Keep HQO home even without match
        mergedHomes.push({
          ...hqoHome,
          // Set missing fields to null
          address: null,
          city: null,
          postalCode: null,
          phone: null,
          lhin: null,
          homeCommunityCare: null,
          homeType: null,
          licensedBeds: null,
          accreditation: null
        })
        noMatchCount++
        console.log(`  ⚠️  No match for: ${hqoHome.name}`)
      }
    })
    
    // Add homes from Public Reporting that weren't in HQO
    prHomes.forEach(prHome => {
      const normalizedName = prHome.name.toUpperCase().trim()
      const alreadyIncluded = hqoHomes.some(h => 
        h.name.toUpperCase().trim() === normalizedName
      )
      
      if (!alreadyIncluded) {
        mergedHomes.push({
          name: prHome.name,
          address: prHome.address,
          city: prHome.city,
          postalCode: prHome.postalCode,
          phone: prHome.phone,
          fax: prHome.fax,
          website: prHome.website,
          lhin: prHome.lhin,
          homeCommunityCare: prHome.homeCommunityCare,
          homeAdministrator: prHome.homeAdministrator,
          licensee: prHome.licensee,
          managementFirm: prHome.managementFirm,
          homeType: prHome.homeType,
          licensedBeds: prHome.licensedBeds,
          approvedShortStayBeds: prHome.approvedShortStayBeds,
          residentsCouncil: prHome.residentsCouncil,
          familyCouncil: prHome.familyCouncil,
          accreditation: prHome.accreditation,
          frenchLanguageServices: prHome.frenchLanguageServices,
          // No quality metrics
          waitTimeCommunity: null,
          waitTimeHospital: null,
          antipsychoticUse: null,
          falls: null,
          restraints: null,
          pressureUlcers: null,
          pain: null,
          depression: null,
          region: prHome.city,
          isProvincial: false
        })
        console.log(`  ➕ Added from Public Reporting: ${prHome.name}`)
      }
    })
    
    console.log('\n✅ Merge complete!')
    console.log(`  Matched: ${matchCount} homes`)
    console.log(`  No match: ${noMatchCount} homes`)
    console.log(`  Total merged: ${mergedHomes.length} homes`)
    
    // Create the final output
    const output = {
      lastUpdated: new Date().toISOString(),
      sources: [
        {
          name: 'Health Quality Ontario',
          url: hqoData.url,
          dataDate: hqoData.scrapedAt,
          provides: 'Quality metrics and wait times'
        },
        {
          name: 'Public Reporting LTC Homes',
          url: prData.url,
          dataDate: prData.scrapedAt,
          provides: 'Location, LHIN, home details, accreditation'
        }
      ],
      totalHomes: mergedHomes.length,
      fields: [
        'name', 'address', 'city', 'postalCode', 'phone', 'fax', 'website',
        'lhin', 'homeCommunityCare', 'homeType', 'licensedBeds', 'accreditation',
        'waitTimeCommunity', 'waitTimeHospital', 'antipsychoticUse', 'falls',
        'restraints', 'pressureUlcers', 'pain', 'depression'
      ],
      data: mergedHomes
    }
    
    // Save merged data
    const outputFile = 'ontario-ltc-merged.json'
    await fs.writeFile(outputFile, JSON.stringify(output, null, 2))
    console.log(`\n💾 Merged data saved to ${outputFile}`)
    
    // Also update the complete file
    await fs.writeFile('ontario-ltc-complete.json', JSON.stringify({
      ...hqoData,
      lastUpdated: new Date().toISOString(),
      homes: mergedHomes
    }, null, 2))
    console.log(`💾 Updated ontario-ltc-complete.json`)
    
    return output
    
  } catch (error) {
    console.error('\n❌ Error merging data:', error.message)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mergeLTCData()
    .then(() => {
      console.log('\n✨ All done!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error)
      process.exit(1)
    })
}

export { mergeLTCData }

