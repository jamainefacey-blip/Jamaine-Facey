module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { destination = 'Paris', checkIn, checkOut, guests = 2, rooms = 1 } = req.body || {};

  const hotelNames = [
    'The Grand Palace', 'Eco Lodge & Spa', 'Harbour View Suites', 'The Botanical',
    'Skyline Tower Hotel', 'Heritage House', 'The Green Retreat', 'Coastal Breeze Resort',
    'Mountain View Lodge', 'City Centre Inn'
  ];
  const amenities = ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking', 'Room Service', 'Concierge', 'EV Charging'];
  const ecoCerts = ['Green Key', 'EarthCheck', 'LEED Certified', 'ISO 14001', null, null];
  const accessFeatures = ['Wheelchair Accessible', 'Elevator', 'Accessible Bathroom', 'Visual Aids', 'Hearing Loop', null, null];

  const hotels = [];
  const count = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const stars = 3 + Math.floor(Math.random() * 3);
    const basePrice = stars * 40 + Math.floor(Math.random() * 120);
    const hotelAmenities = amenities.filter(() => Math.random() > 0.5);
    const eco = ecoCerts[Math.floor(Math.random() * ecoCerts.length)];
    const access = accessFeatures.filter(() => Math.random() > 0.6).filter(Boolean);

    hotels.push({
      id: `HT-${Date.now()}-${i}`,
      name: `${hotelNames[i % hotelNames.length]} ${destination}`,
      destination,
      stars,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      reviewCount: Math.floor(Math.random() * 2000) + 100,
      pricePerNight: basePrice,
      currency: 'GBP',
      amenities: hotelAmenities,
      ecoCertification: eco,
      ecoRating: eco ? (Math.random() > 0.5 ? 'A' : 'B') : (Math.random() > 0.5 ? 'C' : 'D'),
      accessibilityFeatures: access,
      distanceToCentre: (Math.random() * 5).toFixed(1) + ' km',
      mockData: true
    });
  }

  hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);
  res.status(200).json({ hotels, total: hotels.length, source: 'mock' });
};
