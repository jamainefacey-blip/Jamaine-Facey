module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { origin = 'London', destination = 'Paris', transportMode = 'flight', passengers = 1 } = req.body || {};

  const airports = {
    'London': [51.4700, -0.4543], 'Paris': [49.0097, 2.5479], 'New York': [40.6413, -73.7781],
    'Tokyo': [35.7720, 140.3929], 'Dubai': [25.2532, 55.3657], 'Sydney': [-33.9399, 151.1753],
    'Los Angeles': [33.9425, -118.4081], 'Singapore': [1.3644, 103.9915], 'Amsterdam': [52.3105, 4.7683],
    'Barcelona': [41.2974, 2.0833], 'Rome': [41.8003, 12.2389], 'Berlin': [52.3667, 13.5033],
    'Bangkok': [13.6900, 100.7501], 'Istanbul': [41.2753, 28.7519], 'Bali': [-8.7467, 115.1672],
    'LHR': [51.4700, -0.4543], 'JFK': [40.6413, -73.7781], 'CDG': [49.0097, 2.5479],
    'NRT': [35.7720, 140.3929], 'DXB': [25.2532, 55.3657], 'SYD': [-33.9399, 151.1753]
  };

  const toRad = d => d * Math.PI / 180;
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const p1 = airports[origin] || airports['London'];
  const p2 = airports[destination] || airports['Paris'];
  const distance = Math.round(haversine(p1[0], p1[1], p2[0], p2[1]));

  const factors = { flight: 0.255, train: 0.041, bus: 0.089, car: 0.171, ferry: 0.19 };
  const speeds = { flight: 800, train: 200, bus: 80, car: 100, ferry: 40 };

  const modes = Object.keys(factors).map(mode => {
    const co2 = Math.round(distance * factors[mode] * passengers);
    const travelTime = Math.round(distance / speeds[mode]);
    let grade;
    if (co2 < 50) grade = 'A';
    else if (co2 < 100) grade = 'B';
    else if (co2 < 200) grade = 'C';
    else if (co2 < 400) grade = 'D';
    else grade = 'F';
    return { mode, co2Kg: co2, grade, travelTimeHours: travelTime, offsetCostUsd: Math.round(co2 * 0.02 * 100) / 100, viable: distance < (mode === 'flight' ? 20000 : mode === 'train' ? 3000 : mode === 'bus' ? 2000 : mode === 'car' ? 5000 : 1000) };
  });

  const selected = modes.find(m => m.mode === transportMode) || modes[0];

  res.status(200).json({
    origin, destination, distance_km: distance, passengers,
    selected: { mode: transportMode, co2Kg: selected.co2Kg, ecoRating: selected.grade, offsetCostUsd: selected.offsetCostUsd },
    comparison: modes.filter(m => m.viable),
    tip: selected.grade >= 'C' ? `Consider taking the train — it produces ${Math.round((1 - factors.train/factors[transportMode]) * 100)}% less CO2` : 'Great eco choice!'
  });
};
