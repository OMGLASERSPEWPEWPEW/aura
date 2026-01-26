// src/lib/weather.ts
// Weather forecast utility using Open-Meteo API (free, no API key required)

import { NetworkError, ApiError } from './errors';

export interface WeatherForecast {
  date: Date;
  temp_high: number;  // Fahrenheit
  temp_low: number;   // Fahrenheit
  condition: string;
  precipitation_probability: number;
}

interface GeoLocation {
  lat: number;
  lng: number;
}

// Weather code to condition mapping (WMO codes)
const weatherCodeToCondition: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32);
}

// Geocode location string using OpenStreetMap Nominatim (free)
export async function geocodeLocation(locationString: string): Promise<GeoLocation | null> {
  if (!locationString || locationString.trim() === '') {
    console.log('weather.ts: No location provided for geocoding');
    return null;
  }

  try {
    const encodedLocation = encodeURIComponent(locationString);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`,
      {
        headers: {
          'User-Agent': 'AuraApp/1.0 (dating-profile-analyzer)'
        }
      }
    );

    if (!response.ok) {
      const apiError = new ApiError(`Geocoding API error: ${response.statusText}`, {
        statusCode: response.status,
        context: { location: locationString },
      });
      console.log('weather.ts:', apiError.code, apiError.message);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    console.log(`weather.ts: No geocoding results for "${locationString}"`);
    return null;
  } catch (error) {
    const networkError = new NetworkError(
      `Geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
    console.log('weather.ts:', networkError.code, networkError.message);
    return null;
  }
}

// Get weather forecast for a specific date using Open-Meteo API
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  targetDate: Date
): Promise<WeatherForecast | null> {
  try {
    // Format date as YYYY-MM-DD
    const dateStr = targetDate.toISOString().split('T')[0];

    // Open-Meteo API - free, no key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;

    const response = await fetch(url);

    if (!response.ok) {
      const apiError = new ApiError(`Weather API error: ${response.statusText}`, {
        statusCode: response.status,
        context: { latitude, longitude, date: targetDate.toISOString() },
      });
      console.log('weather.ts:', apiError.code, apiError.message);
      return null;
    }

    const data = await response.json();

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      console.log('weather.ts: No weather data returned for date');
      return null;
    }

    const weatherCode = data.daily.weather_code?.[0] ?? 0;

    return {
      date: targetDate,
      temp_high: celsiusToFahrenheit(data.daily.temperature_2m_max[0]),
      temp_low: celsiusToFahrenheit(data.daily.temperature_2m_min[0]),
      condition: weatherCodeToCondition[weatherCode] || 'Unknown',
      precipitation_probability: data.daily.precipitation_probability_max?.[0] ?? 0
    };
  } catch (error) {
    const networkError = new NetworkError(
      `Weather fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
    console.log('weather.ts:', networkError.code, networkError.message);
    return null;
  }
}

// Get weather forecast by location string (combines geocoding + weather)
export async function getWeatherByLocation(
  locationString: string,
  targetDate: Date
): Promise<WeatherForecast | null> {
  const coords = await geocodeLocation(locationString);

  if (!coords) {
    return null;
  }

  return getWeatherForecast(coords.lat, coords.lng, targetDate);
}

// Helper to format weather for display
export function formatWeatherDisplay(forecast: WeatherForecast): string {
  return `${forecast.temp_high}F/${forecast.temp_low}F, ${forecast.condition}`;
}

// Helper to determine if weather is good for outdoor activities
export function isOutdoorFriendly(forecast: WeatherForecast): boolean {
  const badConditions = ['rain', 'snow', 'thunderstorm', 'drizzle', 'freezing'];
  const conditionLower = forecast.condition.toLowerCase();

  const hasBadWeather = badConditions.some(bad => conditionLower.includes(bad));
  const isComfortable = forecast.temp_high >= 50 && forecast.temp_high <= 90;
  const lowPrecipChance = forecast.precipitation_probability < 30;

  return !hasBadWeather && isComfortable && lowPrecipChance;
}
