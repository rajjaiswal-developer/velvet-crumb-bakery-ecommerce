import { db } from '@/lib/db/client';

export default async function LocalBusinessSchema() {
  let settings = null;
  try {
    settings = await db.shopSettings.findUnique({
      where: { id: 'singleton' },
    });
  } catch (error) {
    console.error('Error fetching shop settings for LocalBusiness schema:', error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velvetcrumbdemo.com';

  const businessName = settings?.businessName || 'Velvet Crumb Bakery';
  const phone = settings?.whatsappNumber || '+91 9999900000';
  const address = settings?.businessAddress || '12 Bakers Lane, Demo City';
  const lat = settings?.shopLatitude ?? 19.0760;
  const lng = settings?.shopLongitude ?? 72.8777;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Bakery', 'LocalBusiness', 'Organization'],
    '@id': `${baseUrl}/#bakery`,
    name: businessName,
    url: baseUrl,
    logo: `${baseUrl}/logo-master.png`,
    image: `${baseUrl}/logo-master.png`,
    description: 'Pure 100% eggless and vegetarian bakery crafting fresh cakes and celebration products in 12 Bakers Lane, Demo City.',
    telephone: phone,
    email: settings?.contactEmail || 'hello@velvetcrumbdemo.com',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'Demo City',
      addressRegion: 'Maharashtra',
      postalCode: '400086',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '10:00',
        closes: '22:00',
      },
    ],
    servesCuisine: 'Vegetarian Bakery',
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: lat,
        longitude: lng,
      },
      geoRadius: '5000', // 5 km
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
