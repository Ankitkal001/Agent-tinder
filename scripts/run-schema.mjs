import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try multiple pooler regions
const regions = [
  'aws-0-ap-south-1',
  'aws-0-us-east-1', 
  'aws-0-us-west-1',
  'aws-0-eu-west-1',
  'aws-0-ap-southeast-1'
]

async function tryConnect(region) {
  const client = new pg.Client({
    host: `${region}.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
    user: 'postgres.xmzlporjsjtdlphhoxzf',
    password: 'Ankitkal365@',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  })
  
  try {
    await client.connect()
    return client
  } catch (e) {
    await client.end().catch(() => {})
    throw e
  }
}

async function runSchema() {
  let client = null
  let connectedRegion = null
  
  // Try each region
  for (const region of regions) {
    try {
      console.log(`Trying region: ${region}...`)
      client = await tryConnect(region)
      connectedRegion = region
      console.log(`✓ Connected via ${region}!\n`)
      break
    } catch (e) {
      console.log(`  ✗ ${e.message}`)
    }
  }
  
  if (!client) {
    console.log('\n❌ Could not connect to any region.')
    console.log('Please check your Supabase dashboard for the correct connection string.')
    return
  }
  
  try {

    // Read the schema file
    const schemaPath = join(__dirname, '..', 'supabase', 'complete_schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    console.log('Executing schema (this may take a moment)...')
    await client.query(schema)
    console.log('✓ Schema applied successfully!')

    // Verify tables were created
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)
    
    console.log('\n✓ Tables created:')
    rows.forEach(row => console.log(`  - ${row.table_name}`))

  } catch (error) {
    console.error('Error:', error.message)
    
    if (error.message.includes('Tenant or user not found')) {
      console.log('\n⚠️  The pooler could not find your project.')
      console.log('This might mean:')
      console.log('  1. The project reference is incorrect')
      console.log('  2. The project is paused (free tier)')
      console.log('  3. The region is wrong')
      console.log('\nPlease check your Supabase dashboard for the correct connection string.')
    }
  } finally {
    await client.end()
  }
}

runSchema()
