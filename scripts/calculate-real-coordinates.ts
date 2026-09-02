import { calculateHaversineDistance } from '../lib/delivery/distance';

const SHOP_LAT = 19.0760;
const SHOP_LNG = 72.8777;

// Real-world center coordinates for Mumbai localities surrounding Demo City
const localities = [
  { name: 'Demo City', lat: 19.0866, lng: 72.9081, notes: 'LBS Marg / Station area' },
  { name: 'Demo City East', lat: 19.0812, lng: 72.9110, notes: '60 Feet Rd / MG Road' },
  { name: 'Vidyavihar West', lat: 19.0805, lng: 72.8962, notes: 'Somaiya Campus / Station' },
  { name: 'Vidyavihar East', lat: 19.0815, lng: 72.8995, notes: 'Neelkanth Kingdom / Station East' },
  { name: 'Asalpha', lat: 19.0915, lng: 72.8885, notes: 'Asalpha Metro / Demo City' },
  { name: 'Pant Nagar', lat: 19.0812, lng: 72.9094, notes: 'Demo City East residential area' },
  { name: 'Rajawadi', lat: 19.0825, lng: 72.9045, notes: 'Rajawadi Hospital / Demo City East' },
  { name: 'Garodia Nagar', lat: 19.0828, lng: 72.9125, notes: 'Demo City East residential enclave' },
  { name: 'Vikhroli West', lat: 19.1065, lng: 72.9250, notes: 'Park Site / LBS Marg Vikhroli' },
  { name: 'Powai', lat: 19.1176, lng: 72.9060, notes: 'Hiranandani / Powai Lake South' },
  { name: 'Kurla East', lat: 19.0620, lng: 72.8790, notes: 'Nehru Nagar / SG Barve Marg' },
  { name: 'Chembur', lat: 19.0620, lng: 72.8970, notes: 'Diamond Garden / Chembur Naka' },
  { name: 'Vikhroli East', lat: 19.1110, lng: 72.9350, notes: 'Eastern Express Highway / Tagore Nagar' },
];

console.log(`Bakery Coordinates: ${SHOP_LAT}, ${SHOP_LNG}\n`);
console.log('| Locality | Approximate Center | Center Coordinates | Haversine Distance (km) | Status |');
console.log('|---|---|---|---|---|');

localities.forEach(loc => {
  const dist = calculateHaversineDistance(SHOP_LAT, SHOP_LNG, loc.lat, loc.lng);
  const status = dist <= 5.0 ? '✅ Within 5 km' : '⚠️ EXCEEDS 5 km';
  console.log(`| **${loc.name}** | ${loc.notes} | \`${loc.lat}, ${loc.lng}\` | **${dist.toFixed(2)} km** | ${status} |`);
});
