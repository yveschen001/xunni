import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

const DOWNLOAD_URL = 'http://download.geonames.org/export/dump/cities15000.zip';
const ZIP_FILE = 'cities15000.zip';
const TXT_FILE = 'cities15000.txt';
const SQL_OUTPUT = 'src/db/migrations/0069_seed_cities.sql';

async function downloadFile(url: string, dest: string) {
  if (fs.existsSync(dest)) {
    console.log(`${dest} already exists. Skipping download.`);
    return;
  }
  console.log(`Downloading ${url}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
  const stream = createWriteStream(dest);
  await pipeline(response.body as any, stream);
  console.log('Download complete.');
}

async function main() {
  // 1. Download
  await downloadFile(DOWNLOAD_URL, ZIP_FILE);

  // 2. Unzip
  if (!fs.existsSync(TXT_FILE)) {
    console.log('Unzipping...');
    try {
      execSync(`unzip -o ${ZIP_FILE}`);
    } catch (e) {
      console.error('Unzip failed. Please ensure "unzip" is installed.', e);
      process.exit(1);
    }
  }

  // 3. Process
  console.log('Processing cities...');
  const fileStream = fs.createReadStream(TXT_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const cities: any[] = [];
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    
    // 0: geonameid
    // 1: name (UTF8)
    // 2: asciiname
    // 4: lat
    // 5: lon
    // 8: country code
    // 14: population
    // 17: timezone
    
    const pop = parseInt(cols[14] || '0');
    if (pop < 15000) continue;

    const city = {
      name: cols[1], 
      ascii_name: cols[2], 
      lat: parseFloat(cols[4]),
      lng: parseFloat(cols[5]),
      country_code: cols[8],
      timezone: cols[17],
    };
    
    // Safety check
    if (!city.name || !city.country_code || isNaN(city.lat)) continue;

    cities.push(city);
  }

  console.log(`Found ${cities.length} cities > 15,000 population.`);

  // 4. Generate SQL
  const sqlLines = [
    '-- Seed Geo Data (Cities > 15k)',
    'DELETE FROM geo_cities;', // Clear existing
    'DELETE FROM sqlite_sequence WHERE name="geo_cities";', // Reset auto-increment
  ];
  
  let batch: string[] = [];
  const BATCH_SIZE = 200; // Safe batch size
  
  for (const c of cities) {
    const name = c.name.replace(/'/g, "''");
    const ascii = c.ascii_name.replace(/'/g, "''");
    const tz = c.timezone || 'UTC'; 
    
    batch.push(`('${name}', '${ascii}', ${c.lat}, ${c.lng}, '${c.country_code}', '${tz}')`);
    
    if (batch.length >= BATCH_SIZE) {
      sqlLines.push(`INSERT INTO geo_cities (name, ascii_name, lat, lng, country_code, timezone) VALUES ${batch.join(',')};`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    sqlLines.push(`INSERT INTO geo_cities (name, ascii_name, lat, lng, country_code, timezone) VALUES ${batch.join(',')};`);
  }

  fs.writeFileSync(SQL_OUTPUT, sqlLines.join('\n'));
  console.log(`SQL written to ${SQL_OUTPUT} (${sqlLines.length} lines)`);
}

main().catch(console.error);

