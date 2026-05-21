const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { CONFIG_DIR, ensureDirs, getAllowedUsersPath, getLocationsPath } = require('../src/utils/paths');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

ensureDirs();

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function fetchCityOptions(cityName) {
  try {
    const response = await axios.get(
      `https://www.geonames.org/advanced-search.html?q=${encodeURIComponent(cityName)}`,
      { timeout: 10000 }
    );
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    // The results table has multiple rows with geo class
    $('tr').each((i, row) => {
      if (results.length >= 5) return;
      
      const geoSpan = $(row).find('.geo');
      if (geoSpan.length === 0) return;
      
      const name = $(row).find('td').eq(1).find('a').first().text().trim();
      const lat = geoSpan.find('.latitude').text();
      const lon = geoSpan.find('.longitude').text();
      
      if (name && lat && lon) {
        results.push({ name, lat: parseFloat(lat), lon: parseFloat(lon) });
      }
    });
    
    return results;
  } catch (err) {
    console.error('Error fetching from Geonames:', err.message);
    return [];
  }
}

async function setup() {
  console.log('\n=== Chithi Setup ===\n');
  
  const mainUsername = await question('Enter main username: ');
  if (!mainUsername.trim()) {
    console.log('Main username is required');
    process.exit(1);
  }
  
  const secondaryUsername = await question('Enter secondary username: ');
  if (!secondaryUsername.trim()) {
    console.log('Secondary username is required');
    process.exit(1);
  }
  
  console.log(`\nDatabase backup can be found at /backup/db/${mainUsername}`);
  
  fs.writeFileSync(
    getAllowedUsersPath(),
    JSON.stringify({ usernames: [mainUsername, secondaryUsername] }, null, 2)
  );
  console.log('Allowed users saved');
  
  const locations = {};
  
  for (const username of [mainUsername, secondaryUsername]) {
    console.log(`\n--- Setting up location for ${username} ---`);
    
    let validLocation = false;
    let location = null;
    
    while (!validLocation) {
      const cityName = await question(`Enter city name for ${username}: `);
      
      if (!cityName.trim()) {
        console.log('City name is required');
        continue;
      }
      
      const options = await fetchCityOptions(cityName);
      
      if (options.length === 0) {
        console.log('No results found. Try a different city name.');
        continue;
      }
      
      console.log('\nSelect location:');
      options.forEach((opt, i) => {
        console.log(`${i + 1}. ${opt.name} (${opt.lat}, ${opt.lon})`);
      });
      console.log(`${options.length + 1}. Not there? Type again`);
      
      const choice = await question('Enter number: ');
      const choiceNum = parseInt(choice);
      
      if (choiceNum >= 1 && choiceNum <= options.length) {
        location = options[choiceNum - 1];
        validLocation = true;
      } else {
        console.log('Retrying...\n');
      }
    }
    
    locations[username] = {
      latitude: location.lat,
      longitude: location.lon
    };
    
    console.log(`Location saved for ${username}: ${location.lat}, ${location.lon}`);
  }
  
  fs.writeFileSync(
    getLocationsPath(),
    JSON.stringify(locations, null, 2)
  );
  console.log('\nAll locations saved');
  
  console.log('\n=== Setup Complete! ===');
  console.log('Run "npm start" to start the server');
  
  rl.close();
}

setup().catch((err) => {
  console.error('Setup error:', err);
  rl.close();
  process.exit(1);
});
