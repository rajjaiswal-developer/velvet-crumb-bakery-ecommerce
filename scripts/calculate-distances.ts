import { geocodeAddress } from '../lib/delivery/geocode';
import { calculateHaversineDistance } from '../lib/delivery/distance';

const SHOP_LAT = 19.0760;
const SHOP_LNG = 72.8777;

const localities = [
  '12 Bakers Lane, Demo City',
  'Demo City East, Mumbai',
  'Vidyavihar West, Mumbai',
  'Vidyavihar East, Mumbai',
  'Vikhroli West, Mumbai',
  'Vikhroli East, Mumbai',
  'Kurla East, Mumbai',
  'Asalpha, 12 Bakers Lane, Demo City',
  'Pant Nagar, Demo City East, Mumbai',
  'Rajawadi, Demo City East, Mumbai',
  'Garodia Nagar, Demo City East, Mumbai',
  'Chembur, Mumbai',
  'Powai, Mumbai',
];

async function main() {
  console.log(`Bakery Coordinates: ${SHOP_LAT}, ${SHOP_LNG}\n`);
  console.log('| Locality | Latitude | Longitude | Distance (km) | Status |');
  console.log('|---|---|---|---|---|');

  for (const locality of localities) {
    try {
      const geo = await geocodeAddress(locality);
      const dist = calculateHaversineDistance(SHOP_LAT, SHOP_LNG, geo.lat, geo.lng);
      const status = dist <= 5.0 ? '✅ Within 5km' : '⚠️ EXCEEDS 5km';
      console.log(`| ${locality.replace(', Mumbai', '')} | ${geo.lat.toFixed(6)} | ${geo.lng.toFixed(6)} | ${dist.toFixed(2)} km | ${status} |`);
    } catch (e: any) {
      console.log(`| ${locality} | Error: ${e.message} |`);
    }
  }
}

main().catch(console.error);
