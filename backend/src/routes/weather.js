const express = require('express');
const router = express.Router();
const { getOne, runQuery, nowISO } = require('../db');
const fs = require('fs');
const axios = require('axios');
const { getLocationsPath } = require('../utils/paths');

const CACHE_TTL = 15 * 60 * 1000;

router.get('/', async (req, res) => {
  const username = req.headers['x-username'];
  
  const cached = getOne('SELECT * FROM weather WHERE username = ?', [username]);
  
  if (cached) {
    const cacheAge = Date.now() - new Date(cached.cachedAt).getTime();
    if (cacheAge < CACHE_TTL) {
      return res.json(cached);
    }
  }
  
  let lat, lon;
  if (cached) {
    lat = cached.latitude;
    lon = cached.longitude;
  } else {
    const locationConfig = getLocationsPath();
    if (fs.existsSync(locationConfig)) {
      const locations = JSON.parse(fs.readFileSync(locationConfig, 'utf-8'));
      const userLoc = locations[username];
      if (userLoc) {
        lat = userLoc.latitude;
        lon = userLoc.longitude;
      }
    }
  }
  
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Location not configured for user' });
  }
  
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code`
    );
    
    const weatherCode = response.data.current.weather_code;
    const weatherCondition = mapWeatherCode(weatherCode);
    
    if (cached) {
      runQuery('UPDATE weather SET weather_condition = ?, cachedAt = ? WHERE id = ?', [weatherCondition, nowISO(), cached.id]);
    } else {
      runQuery('INSERT INTO weather (username, latitude, longitude, weather_condition, cachedAt) VALUES (?, ?, ?, ?, ?)',
        [username, lat, lon, weatherCondition, nowISO()]);
    }
    
    const updated = getOne('SELECT * FROM weather WHERE username = ?', [username]);
    res.json(updated);
  } catch (err) {
    console.error('Weather API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

const mapWeatherCode = (code) => {
  const codes = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    80: 'Slight Showers',
    81: 'Moderate Showers',
    82: 'Violent Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail'
  };
  return codes[code] || 'Unknown';
};

module.exports = router;
