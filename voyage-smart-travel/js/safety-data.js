/* ═══════════════════════════════════════════════════════════════════
   VST Safety Engine — Data v1
   Country safety profiles, advisories, emergency contacts, indices
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Advisory status levels ──────────────────────────────────────── */
  var ADVISORY = {
    GREEN:  { code: 'green',  label: 'Safe to visit',      color: '#00d4aa' },
    YELLOW: { code: 'yellow', label: 'Exercise caution',   color: '#f59e0b' },
    ORANGE: { code: 'orange', label: 'High caution',       color: '#f97316' },
    RED:    { code: 'red',    label: 'Reconsider travel',  color: '#ef4444' }
  };

  /* ── Country profiles ────────────────────────────────────────────── */
  /*
   * Risk scores: 1 (very low) → 5 (very high)
   * Safety score: 0–100 (higher = safer overall)
   * Women's safety index: 0–100
   * LGBTQ+ safety index: 0–100
   */
  var COUNTRIES = [
    {
      id: 'jp',
      name: 'Japan',
      region: 'asia',
      flag: '🇯🇵',
      city: 'Tokyo / Kyoto / Osaka',
      advisory: ADVISORY.GREEN,
      safetyScore: 91,
      womensIndex: 72,
      lgbtqIndex: 58,
      risk: { crime: 1, health: 2, naturalDisaster: 4, politicalStability: 1 },
      emergencyContacts: {
        police: '110',
        ambulance: '119',
        fire: '119',
        embassy: '+81-3-3224-5000',
        hospitalName: 'St. Luke\'s International Hospital, Tokyo',
        hospitalPhone: '+81-3-5550-7166'
      },
      medicalFacilities: [
        { name: 'St. Luke\'s International Hospital', city: 'Tokyo', tier: 'International' },
        { name: 'Osaka Red Cross Hospital', city: 'Osaka', tier: 'Regional' },
        { name: 'Kyoto University Hospital', city: 'Kyoto', tier: 'University' }
      ],
      alerts: [],
      tips: [
        'Carry your passport or a copy — ID checks are rare but enforceable.',
        'Earthquakes are frequent; learn the hotel evacuation plan on arrival.',
        'Tap water is safe to drink throughout the country.',
        'Crime is extremely low; lost items are routinely handed to police.'
      ]
    },
    {
      id: 'it',
      name: 'Italy',
      region: 'europe',
      flag: '🇮🇹',
      city: 'Rome / Florence / Amalfi Coast',
      advisory: ADVISORY.GREEN,
      safetyScore: 79,
      womensIndex: 68,
      lgbtqIndex: 65,
      risk: { crime: 2, health: 1, naturalDisaster: 2, politicalStability: 2 },
      emergencyContacts: {
        police: '113',
        ambulance: '118',
        fire: '115',
        embassy: '+39-06-4674-1',
        hospitalName: 'Policlinico Umberto I, Rome',
        hospitalPhone: '+39-06-49971'
      },
      medicalFacilities: [
        { name: 'Policlinico Umberto I', city: 'Rome', tier: 'University' },
        { name: 'Ospedale di Careggi', city: 'Florence', tier: 'Regional' },
        { name: 'Ospedale Civile di Padova', city: 'Padova', tier: 'Regional' }
      ],
      alerts: [
        { level: 'info', text: 'Pickpocketing reported near Rome\'s Trevi Fountain and Vatican. Keep bags close.' }
      ],
      tips: [
        'Pickpocketing is the main concern in tourist areas — use a money belt.',
        'Emergency number 112 also works across all EU countries.',
        'Travel insurance with medical cover is strongly recommended.',
        'Solo women travelers: tourist areas are generally safe after dark.'
      ]
    },
    {
      id: 'is',
      name: 'Iceland',
      region: 'europe',
      flag: '🇮🇸',
      city: 'Reykjavík / Ring Road',
      advisory: ADVISORY.GREEN,
      safetyScore: 96,
      womensIndex: 94,
      lgbtqIndex: 92,
      risk: { crime: 1, health: 1, naturalDisaster: 3, politicalStability: 1 },
      emergencyContacts: {
        police: '112',
        ambulance: '112',
        fire: '112',
        embassy: '+354-595-2200',
        hospitalName: 'Landspítali University Hospital, Reykjavík',
        hospitalPhone: '+354-543-1000'
      },
      medicalFacilities: [
        { name: 'Landspítali University Hospital', city: 'Reykjavík', tier: 'University' },
        { name: 'Akureyri Hospital', city: 'Akureyri', tier: 'Regional' }
      ],
      alerts: [],
      tips: [
        'Ranked #1 safest country globally for eight consecutive years.',
        'Volcanic activity and geothermal zones require designated-path adherence.',
        'Weather changes rapidly; dress in layers regardless of season.',
        'LGBTQ+ travelers are warmly welcomed — one of the world\'s most inclusive destinations.'
      ]
    },
    {
      id: 'ma',
      name: 'Morocco',
      region: 'africa',
      flag: '🇲🇦',
      city: 'Marrakech / Fes / Casablanca',
      advisory: ADVISORY.YELLOW,
      safetyScore: 63,
      womensIndex: 42,
      lgbtqIndex: 18,
      risk: { crime: 3, health: 3, naturalDisaster: 2, politicalStability: 2 },
      emergencyContacts: {
        police: '19',
        ambulance: '15',
        fire: '15',
        embassy: '+212-537-637-200',
        hospitalName: 'Clinique Internationale de Marrakech',
        hospitalPhone: '+212-524-300-100'
      },
      medicalFacilities: [
        { name: 'Clinique Internationale de Marrakech', city: 'Marrakech', tier: 'International' },
        { name: 'Hôpital Ibn Sina', city: 'Rabat', tier: 'University' },
        { name: 'Clinique du Littoral', city: 'Casablanca', tier: 'Regional' }
      ],
      alerts: [
        { level: 'warn', text: 'Scam activity targeting tourists in Jemaa el-Fna square. Decline unsolicited guide offers.' },
        { level: 'info', text: 'Solo women travelers should dress conservatively outside tourist areas.' }
      ],
      tips: [
        'LGBTQ+ relationships are illegal; discretion is essential.',
        'Drink only bottled water; avoid raw salads from street vendors.',
        'Agree prices before taking taxis; metered cabs are labeled "Petit Taxi".',
        'Women may experience unwanted attention; confidence and assertiveness helps.'
      ]
    },
    {
      id: 'id',
      name: 'Indonesia',
      region: 'asia',
      flag: '🇮🇩',
      city: 'Bali / Jakarta / Lombok',
      advisory: ADVISORY.YELLOW,
      safetyScore: 68,
      womensIndex: 54,
      lgbtqIndex: 22,
      risk: { crime: 2, health: 3, naturalDisaster: 4, politicalStability: 2 },
      emergencyContacts: {
        police: '110',
        ambulance: '118',
        fire: '113',
        embassy: '+62-21-5296-5000',
        hospitalName: 'BIMC Hospital, Bali',
        hospitalPhone: '+62-361-761-263'
      },
      medicalFacilities: [
        { name: 'BIMC Hospital Nusa Dua', city: 'Bali', tier: 'International' },
        { name: 'Siloam Hospitals Kebon Jeruk', city: 'Jakarta', tier: 'Regional' },
        { name: 'Rumah Sakit Umum Mataram', city: 'Lombok', tier: 'Regional' }
      ],
      alerts: [
        { level: 'warn', text: 'Mount Agung (Bali) on elevated volcanic watch. Check PVMBG updates before trekking.' }
      ],
      tips: [
        'Volcano and tsunami risk is real; familiarise yourself with evacuation routes.',
        'Drink only bottled water; dengue fever risk — use DEET repellent.',
        'Temple dress codes are strictly enforced; carry a sarong.',
        'Homosexuality is criminalised in Aceh province and increasingly restricted nationwide.'
      ]
    },
    {
      id: 'ar',
      name: 'Argentina',
      region: 'americas',
      flag: '🇦🇷',
      city: 'Buenos Aires / Patagonia / Mendoza',
      advisory: ADVISORY.YELLOW,
      safetyScore: 66,
      womensIndex: 61,
      lgbtqIndex: 82,
      risk: { crime: 3, health: 2, naturalDisaster: 2, politicalStability: 3 },
      emergencyContacts: {
        police: '911',
        ambulance: '107',
        fire: '100',
        embassy: '+54-11-5777-4533',
        hospitalName: 'Hospital Italiano de Buenos Aires',
        hospitalPhone: '+54-11-4959-0200'
      },
      medicalFacilities: [
        { name: 'Hospital Italiano de Buenos Aires', city: 'Buenos Aires', tier: 'University' },
        { name: 'Clínica Los Andes', city: 'Mendoza', tier: 'Regional' },
        { name: 'Hospital Zonal General de Agudos', city: 'Bariloche', tier: 'Regional' }
      ],
      alerts: [
        { level: 'info', text: 'Express kidnapping incidents reported in Buenos Aires. Use radio taxis or apps (Cabify/Uber).' }
      ],
      tips: [
        'Argentina has full marriage equality and is widely LGBTQ+ friendly.',
        'Economic instability means ATM limits change frequently; carry some USD cash.',
        'Mugging risk in Buenos Aires after dark; use app-based taxis.',
        'Patagonia weather is extreme and fast-changing; pack accordingly.'
      ]
    },
    {
      id: 'ke',
      name: 'Kenya',
      region: 'africa',
      flag: '🇰🇪',
      city: 'Nairobi / Masai Mara / Mombasa',
      advisory: ADVISORY.ORANGE,
      safetyScore: 52,
      womensIndex: 46,
      lgbtqIndex: 12,
      risk: { crime: 4, health: 4, naturalDisaster: 2, politicalStability: 3 },
      emergencyContacts: {
        police: '999',
        ambulance: '999',
        fire: '999',
        embassy: '+254-20-363-6000',
        hospitalName: 'Aga Khan University Hospital, Nairobi',
        hospitalPhone: '+254-20-366-2000'
      },
      medicalFacilities: [
        { name: 'Aga Khan University Hospital', city: 'Nairobi', tier: 'International' },
        { name: 'Nairobi Hospital', city: 'Nairobi', tier: 'Regional' },
        { name: 'Coast General Teaching & Referral Hospital', city: 'Mombasa', tier: 'Regional' }
      ],
      alerts: [
        { level: 'warn', text: 'Elevated terrorism risk in border regions and coastal areas. Stay informed via local news.' },
        { level: 'warn', text: 'Malaria is endemic. Prophylaxis and DEET repellent are essential.' }
      ],
      tips: [
        'Malaria prophylaxis, yellow fever vaccine, and hepatitis A/B vaccines required.',
        'LGBTQ+ relationships are criminalised; exercise strict discretion.',
        'Use vetted safari operators; avoid unofficial guides.',
        'Avoid Nairobi CBD and Eastleigh district at night.'
      ]
    },
    {
      id: 'no',
      name: 'Norway',
      region: 'europe',
      flag: '🇳🇴',
      city: 'Oslo / Bergen / Tromsø',
      advisory: ADVISORY.GREEN,
      safetyScore: 94,
      womensIndex: 91,
      lgbtqIndex: 90,
      risk: { crime: 1, health: 1, naturalDisaster: 1, politicalStability: 1 },
      emergencyContacts: {
        police: '112',
        ambulance: '113',
        fire: '110',
        embassy: '+47-21-30-85-40',
        hospitalName: 'Oslo University Hospital',
        hospitalPhone: '+47-02-770'
      },
      medicalFacilities: [
        { name: 'Oslo University Hospital (Rikshospitalet)', city: 'Oslo', tier: 'University' },
        { name: 'Haukeland University Hospital', city: 'Bergen', tier: 'University' },
        { name: 'University Hospital of North Norway', city: 'Tromsø', tier: 'University' }
      ],
      alerts: [],
      tips: [
        'One of the safest countries in the world; violent crime is extremely rare.',
        'LGBTQ+ travelers are fully protected by law and openly welcomed.',
        'Winter driving in northern Norway requires snow chains or winter tyres.',
        'Arctic wilderness: always file a hiking plan and carry an emergency beacon.'
      ]
    },
    {
      id: 'pt',
      name: 'Portugal',
      region: 'europe',
      flag: '🇵🇹',
      city: 'Lisbon / Porto / Algarve',
      advisory: ADVISORY.GREEN,
      safetyScore: 84,
      womensIndex: 76,
      lgbtqIndex: 80,
      risk: { crime: 2, health: 1, naturalDisaster: 2, politicalStability: 1 },
      emergencyContacts: {
        police: '112',
        ambulance: '112',
        fire: '112',
        embassy: '+351-21-770-2122',
        hospitalName: 'Hospital de Santa Maria, Lisbon',
        hospitalPhone: '+351-21-780-5000'
      },
      medicalFacilities: [
        { name: 'Hospital de Santa Maria', city: 'Lisbon', tier: 'University' },
        { name: 'Hospital de São João', city: 'Porto', tier: 'University' },
        { name: 'Centro Hospitalar do Algarve', city: 'Faro', tier: 'Regional' }
      ],
      alerts: [],
      tips: [
        'Highly LGBTQ+ friendly — same-sex marriage and adoption are legal.',
        'Pickpocketing on Lisbon\'s tram 28 and in Alfama is the primary concern.',
        'Wildfire risk in summer months — check regional alerts.',
        'Tap water is safe in all major cities.'
      ]
    },
    {
      id: 'es',
      name: 'Spain',
      region: 'europe',
      flag: '🇪🇸',
      city: 'Barcelona / Madrid / Seville',
      advisory: ADVISORY.GREEN,
      safetyScore: 80,
      womensIndex: 73,
      lgbtqIndex: 84,
      risk: { crime: 2, health: 1, naturalDisaster: 2, politicalStability: 2 },
      emergencyContacts: {
        police: '112',
        ambulance: '112',
        fire: '112',
        embassy: '+34-91-587-2200',
        hospitalName: 'Hospital Clínic de Barcelona',
        hospitalPhone: '+34-93-227-5400'
      },
      medicalFacilities: [
        { name: 'Hospital Clínic de Barcelona', city: 'Barcelona', tier: 'University' },
        { name: 'Hospital Gregorio Marañón', city: 'Madrid', tier: 'University' },
        { name: 'Hospital Virgen del Rocío', city: 'Seville', tier: 'University' }
      ],
      alerts: [
        { level: 'info', text: 'Petty theft and bag snatching on Las Ramblas, Barcelona. Keep valuables secured.' }
      ],
      tips: [
        'Barcelona\'s Las Ramblas and the Metro require extra vigilance.',
        'One of Europe\'s most LGBTQ+ friendly countries; Barcelona Pride is world-famous.',
        'Heat warnings in July–August; stay hydrated and seek shade.',
        'Emergency number 112 is free and multilingual.'
      ]
    }
  ];

  /* ── Live safety alerts (simulated; refresh cycle via JS) ─────────── */
  var GLOBAL_ALERTS = [
    {
      id: 'al-001',
      level: 'warn',
      region: 'Southeast Asia',
      title: 'Monsoon season flooding',
      body: 'Thailand, Vietnam, and Indonesia are experiencing above-average rainfall. Check local transport advisories before travel.',
      updated: '2026-05-15'
    },
    {
      id: 'al-002',
      level: 'info',
      region: 'Western Europe',
      title: 'Summer tourism surge',
      body: 'Pickpocketing incidents typically rise 40% in June–August across Mediterranean cities. Stay alert in crowded areas.',
      updated: '2026-05-14'
    },
    {
      id: 'al-003',
      level: 'warn',
      region: 'East Africa',
      title: 'Elevated terrorism risk',
      body: 'UK FCDO and US State Dept maintain elevated threat advisories for Kenya border regions and parts of Ethiopia.',
      updated: '2026-05-13'
    },
    {
      id: 'al-004',
      level: 'info',
      region: 'Global',
      title: 'Health: mpox monitoring',
      body: 'WHO continues monitoring mpox variants. Vaccination is recommended for high-risk travelers. Consult your travel clinic.',
      updated: '2026-05-12'
    },
    {
      id: 'al-005',
      level: 'critical',
      region: 'Middle East',
      title: 'Active conflict zones',
      body: 'Do not travel to Gaza, Yemen, Sudan, or conflict-affected areas of Syria and Libya. FCDO advises against all travel.',
      updated: '2026-05-15'
    }
  ];

  /* ── Safety tips by category ─────────────────────────────────────── */
  var TIPS_BY_CATEGORY = {
    solo: {
      label: 'Solo Travel',
      icon: 'person',
      tips: [
        'Share your itinerary with someone at home and check in regularly.',
        'Research the neighbourhood of your accommodation before booking.',
        'Trust your instincts — if a situation feels off, leave.',
        'Keep a photo of your accommodation address in your phone\'s camera roll.',
        'Download offline maps (Google Maps or Maps.me) before you arrive.'
      ]
    },
    women: {
      label: "Women's Safety",
      icon: 'heart',
      tips: [
        'Research local dress norms before arrival — dressing appropriately reduces unwanted attention.',
        'Book the first night\'s accommodation in advance so you\'re not searching on arrival.',
        'Use women-only train carriages where available (Japan, India, Egypt).',
        'Carry a personal safety alarm; they\'re legal in most countries.',
        'Meet new people in public spaces; never accept drinks from strangers.'
      ]
    },
    lgbtq: {
      label: 'LGBTQ+ Travel',
      icon: 'rainbow',
      tips: [
        'Research local laws before travel — same-sex relationships are illegal in 68+ countries.',
        'In hostile destinations, avoid public displays of affection.',
        'ILGA World publishes an annual map of LGBTQ+ laws by country — consult it.',
        'Book LGBTQ+-affirming accommodation through platforms like misterb&b or Out in the World.',
        'Know your embassy\'s 24-hour emergency number in case of legal issues.'
      ]
    },
    health: {
      label: 'Health & Medical',
      icon: 'medical',
      tips: [
        'Consult a travel clinic 6–8 weeks before departure for vaccinations.',
        'Carry a 30-day supply of any prescription medications, with original packaging.',
        'Check if your travel insurance covers emergency medical evacuation.',
        'Purchase a medical-grade water purifier for regions with unsafe tap water.',
        'Know the local equivalent of 999/911 before you need it.'
      ]
    },
    digital: {
      label: 'Digital Safety',
      icon: 'lock',
      tips: [
        'Use a VPN on public Wi-Fi; airports and hotel networks are frequent attack surfaces.',
        'Enable two-factor authentication on all accounts before you travel.',
        'Carry a charged power bank — low battery is a safety risk.',
        'Back up important documents to encrypted cloud storage.',
        'Keep Bluetooth off in crowded areas to prevent packet sniffing.'
      ]
    },
    emergency: {
      label: 'Emergency Prep',
      icon: 'alert',
      tips: [
        'Register with your country\'s embassy travel registration service (e.g. FCDO, STEP).',
        'Carry a physical emergency card with blood type, allergies, and next-of-kin.',
        'Know the location of your nearest embassy or consulate.',
        'Photograph all travel documents and email to yourself before departure.',
        'Keep €50/$50 in cash separate from your main wallet for emergencies.'
      ]
    }
  };

  /* ── Women's safety index details ────────────────────────────────── */
  var WOMENS_INDEX = {
    description: "VST's Women's Safety Index scores destinations across five pillars: legal protections, street safety, harassment risk, solo-travel infrastructure, and local attitudes. Scores are aggregated from Georgetown Institute for Women, Peace and Security data and traveller reports.",
    top: ['Iceland', 'Norway', 'Finland', 'New Zealand', 'Portugal'],
    bottom: ['Yemen', 'Syria', 'Afghanistan', 'Pakistan', 'Saudi Arabia']
  };

  /* ── LGBTQ+ safety index details ─────────────────────────────────── */
  var LGBTQ_INDEX = {
    description: "VST's LGBTQ+ Safety Index is compiled from ILGA World's State-Sponsored Homophobia Report, Equaldex legal database, and traveller safety reports. Scores reflect legal status, enforcement, and social attitudes.",
    top: ['Iceland', 'Norway', 'Netherlands', 'Canada', 'Spain'],
    bottom: ['Yemen', 'Iran', 'Saudi Arabia', 'Afghanistan', 'Nigeria']
  };

  /* ── Export ──────────────────────────────────────────────────────── */
  window.VSTSafetyData = {
    ADVISORY:         ADVISORY,
    COUNTRIES:        COUNTRIES,
    GLOBAL_ALERTS:    GLOBAL_ALERTS,
    TIPS_BY_CATEGORY: TIPS_BY_CATEGORY,
    WOMENS_INDEX:     WOMENS_INDEX,
    LGBTQ_INDEX:      LGBTQ_INDEX
  };

}());
