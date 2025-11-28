import { readFileSync } from 'fs'
import { join } from 'path'

// Serverless function to serve LTC data
export default function handler(req, res) {
  try {
    // Load the merged data file
    const dataPath = join(process.cwd(), 'ontario-ltc-merged.json')
    const rawData = readFileSync(dataPath, 'utf-8')
    const jsonData = JSON.parse(rawData)
    
    // Return the data
    res.status(200).json({
      data: jsonData.data || [],
      lastUpdated: jsonData.lastUpdated,
      source: 'Ontario LTC Merged Data',
      note: 'Deployed on Vercel'
    })
  } catch (error) {
    console.error('Error loading data:', error)
    res.status(500).json({ 
      error: 'Failed to load LTC home data',
      message: error.message 
    })
  }
}

