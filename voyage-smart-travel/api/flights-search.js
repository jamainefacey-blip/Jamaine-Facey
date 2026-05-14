module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { origin = 'LHR', destination = 'JFK', departDate, returnDate, passengers = 1, cabinClass = 'economy' } = req.body || {};

  const airlines = [
    { code: 'BA', name: 'British Airways', eco: 'B' },
    { code: 'VS', name: 'Virgin Atlantic', eco: 'A' },
    { code: 'AA', name: 'American Airlines', eco: 'C' },
    { code: 'DL', name: 'Delta Air Lines', eco: 'B' },
    { code: 'UA', name: 'United Airlines', eco: 'C' },
    { code: 'LH', name: 'Lufthansa', eco: 'A' },
    { code: 'AF', name: 'Air France', eco: 'B' },
    { code: 'KL', name: 'KLM', eco: 'A' }
  ];

  const cabinMultiplier = { economy: 1, premium_economy: 1.8, business: 3.2, first: 5.5 };
  const basePrice = 250 + Math.floor(Math.random() * 400);

  const flights = [];
  const count = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const stops = Math.random() > 0.6 ? Math.floor(Math.random() * 2) + 1 : 0;
    const departHour = 6 + Math.floor(Math.random() * 14);
    const duration = 5 + Math.floor(Math.random() * 8) + stops * 2;
    const price = Math.round((basePrice + Math.random() * 300) * (cabinMultiplier[cabinClass] || 1));
    const co2 = Math.round(150 + Math.random() * 200);

    flights.push({
      id: `FL-${Date.now()}-${i}`,
      airline: airline.name,
      airlineCode: airline.code,
      origin,
      destination,
      departTime: `${String(departHour).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
      arriveTime: `${String((departHour + duration) % 24).padStart(2,'0')}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
      duration: `${duration}h ${Math.floor(Math.random()*50)+10}m`,
      stops,
      price,
      currency: 'GBP',
      cabinClass,
      ecoRating: airline.eco,
      co2Kg: co2,
      seatsLeft: Math.floor(Math.random() * 8) + 1,
      mockData: true
    });
  }

  flights.sort((a, b) => a.price - b.price);
  res.status(200).json({ flights, total: flights.length, source: 'mock' });
};
