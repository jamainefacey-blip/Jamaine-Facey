// VST Platform — Destination + Visa Seed Data
// ~25 popular destinations with GB passport visa requirements.
// Source: FCDO Travel Advice + IATA Travel Centre (verified 2024-01-01).
// Run via VisaService.onModuleInit() — idempotent upsert.

export interface DestinationSeed {
  countryCode: string;
  countryName: string;
  region: string;
}

export interface VisaSeed {
  destinationCode: string;
  passportNationality: string;
  visaType: 'VISA_FREE' | 'VISA_ON_ARRIVAL' | 'E_VISA' | 'VISA_REQUIRED' | 'UNKNOWN';
  maxStayDays: number | null;
  notes: string | null;
  officialUrl: string | null;
  lastVerifiedAt: string; // ISO date
}

export interface EmbassySeed {
  destinationCode: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  emergencyLine: string | null;
}

export const DESTINATION_SEEDS: DestinationSeed[] = [
  { countryCode: 'TH', countryName: 'Thailand',          region: 'Southeast Asia'  },
  { countryCode: 'JP', countryName: 'Japan',             region: 'East Asia'        },
  { countryCode: 'US', countryName: 'United States',     region: 'North America'    },
  { countryCode: 'AE', countryName: 'UAE',               region: 'Middle East'      },
  { countryCode: 'FR', countryName: 'France',            region: 'Western Europe'   },
  { countryCode: 'ES', countryName: 'Spain',             region: 'Western Europe'   },
  { countryCode: 'IT', countryName: 'Italy',             region: 'Southern Europe'  },
  { countryCode: 'GR', countryName: 'Greece',            region: 'Southern Europe'  },
  { countryCode: 'PT', countryName: 'Portugal',          region: 'Western Europe'   },
  { countryCode: 'DE', countryName: 'Germany',           region: 'Central Europe'   },
  { countryCode: 'AU', countryName: 'Australia',         region: 'Oceania'          },
  { countryCode: 'CA', countryName: 'Canada',            region: 'North America'    },
  { countryCode: 'IN', countryName: 'India',             region: 'South Asia'       },
  { countryCode: 'ID', countryName: 'Indonesia',         region: 'Southeast Asia'   },
  { countryCode: 'TR', countryName: 'Türkiye',           region: 'Middle East/Europe'},
  { countryCode: 'MX', countryName: 'Mexico',            region: 'Latin America'    },
  { countryCode: 'ZA', countryName: 'South Africa',      region: 'Africa'           },
  { countryCode: 'KE', countryName: 'Kenya',             region: 'East Africa'      },
  { countryCode: 'MA', countryName: 'Morocco',           region: 'North Africa'     },
  { countryCode: 'SG', countryName: 'Singapore',         region: 'Southeast Asia'   },
  { countryCode: 'MY', countryName: 'Malaysia',          region: 'Southeast Asia'   },
  { countryCode: 'NZ', countryName: 'New Zealand',       region: 'Oceania'          },
  { countryCode: 'BR', countryName: 'Brazil',            region: 'Latin America'    },
  { countryCode: 'PH', countryName: 'Philippines',       region: 'Southeast Asia'   },
  { countryCode: 'VN', countryName: 'Vietnam',           region: 'Southeast Asia'   },
];

// GB passport holders only — extend with other nationalities in Phase 5.
export const VISA_SEEDS: VisaSeed[] = [
  {
    destinationCode: 'TH', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 30,
    notes: 'Visa exemption stamp on arrival. Must have onward ticket and proof of funds.',
    officialUrl: 'https://www.thaiembassy.com/thailand-visa/thailand-visa-exemption',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'JP', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Reciprocal visa-free arrangement. No extensions permitted without applying in-country.',
    officialUrl: 'https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'US', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'ESTA required ($21). Must apply before travel. Not a visa — authorisation only.',
    officialUrl: 'https://esta.cbp.dhs.gov',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'AE', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: '90-day visa-free stay. Extendable once for 90 days in-country.',
    officialUrl: 'https://u.ae/en/information-and-services/visa-and-emirates-id/do-you-need-an-entry-permit-to-visit-the-uae',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'FR', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Schengen Area: 90 days in any 180-day period across all Schengen countries. ETIAS required from mid-2025.',
    officialUrl: 'https://www.schengenvisainfo.com/schengen-visa-countries-list/',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'ES', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Schengen Area: 90 days in any 180-day period. ETIAS required from mid-2025.',
    officialUrl: 'https://www.schengenvisainfo.com/schengen-visa-countries-list/',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'IT', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Schengen Area: 90 days in any 180-day period. ETIAS required from mid-2025.',
    officialUrl: 'https://www.schengenvisainfo.com/schengen-visa-countries-list/',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'GR', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Schengen Area: 90 days in any 180-day period. ETIAS required from mid-2025.',
    officialUrl: 'https://www.schengenvisainfo.com/schengen-visa-countries-list/',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'PT', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Schengen Area: 90 days in any 180-day period. ETIAS required from mid-2025.',
    officialUrl: 'https://www.schengenvisainfo.com/schengen-visa-countries-list/',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'DE', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'Schengen Area: 90 days in any 180-day period. ETIAS required from mid-2025.',
    officialUrl: 'https://www.schengenvisainfo.com/schengen-visa-countries-list/',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'AU', passportNationality: 'GB',
    visaType: 'E_VISA', maxStayDays: 90,
    notes: 'eVisitor (subclass 651) — free, apply online. 3 months per visit, multiple entry within 12 months.',
    officialUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/evisitor-651',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'CA', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 180,
    notes: 'eTA required (CAD $7). Apply before travel. Multiple entry for 5 years or until passport expiry.',
    officialUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'IN', passportNationality: 'GB',
    visaType: 'E_VISA', maxStayDays: 90,
    notes: 'e-Tourist Visa (eTV). Apply 4 days before arrival. Double entry. Must arrive at designated airports.',
    officialUrl: 'https://indianvisaonline.gov.in/evisa/tvoa.html',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'ID', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 30,
    notes: 'Visa-Free Entry. Extendable once for 30 days at immigration office.',
    officialUrl: 'https://www.imigrasi.go.id',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'TR', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: '90 days in a 180-day period. Passport must be valid for 6 months beyond stay.',
    officialUrl: 'https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'MX', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 180,
    notes: 'No visa required. Tourist card (FMM) issued on arrival or in flight.',
    officialUrl: 'https://www.gob.mx/sre',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'ZA', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'No visa required. Must have 2 blank passport pages on arrival.',
    officialUrl: 'https://www.dha.gov.za/index.php/civic-services/apply-for-a-visa',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'KE', passportNationality: 'GB',
    visaType: 'E_VISA', maxStayDays: 90,
    notes: 'eVisa required. Single or multiple entry. Apply via eCitizen portal.',
    officialUrl: 'https://www.ecitizen.go.ke',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'MA', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'No visa required for tourism or business. Passport must be valid for duration of stay.',
    officialUrl: 'https://www.embassyofmorocco.us/visas.htm',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'SG', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 30,
    notes: 'No visa required. 30-day social visit pass issued on arrival. Extendable to 90 days.',
    officialUrl: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'MY', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'No visa required. Stamp on arrival. Must have onward/return ticket.',
    officialUrl: 'https://www.imi.gov.my',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'NZ', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 90,
    notes: 'NZeTA required (NZD $17 app + NZD $35 IVL). Apply before travel. Multiple entry, 2 years.',
    officialUrl: 'https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/visa-factsheet/new-zealand-electronic-travel-authority',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'BR', passportNationality: 'GB',
    visaType: 'E_VISA', maxStayDays: 90,
    notes: 'eVisa required since 2024. Apply online before travel. £74 fee. 90 days per year total.',
    officialUrl: 'https://brazil.vfsevisa.com',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'PH', passportNationality: 'GB',
    visaType: 'VISA_FREE', maxStayDays: 30,
    notes: 'Visa-free for 30 days. Extendable up to 36 months total via Bureau of Immigration.',
    officialUrl: 'https://immigration.gov.ph',
    lastVerifiedAt: '2024-01-01',
  },
  {
    destinationCode: 'VN', passportNationality: 'GB',
    visaType: 'E_VISA', maxStayDays: 90,
    notes: 'E-visa required ($25). Multiple entry. Apply via official portal. 45-day single, 90-day multiple.',
    officialUrl: 'https://evisa.xuatnhapcanh.gov.vn',
    lastVerifiedAt: '2024-01-01',
  },
];

export const EMBASSY_SEEDS: EmbassySeed[] = [
  {
    destinationCode: 'TH',
    name: 'British Embassy Bangkok',
    address: '14 Wireless Road, Lumphini, Pathum Wan, Bangkok 10330',
    phone: '+66 2 305 8333',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-embassy-bangkok',
    emergencyLine: '+66 2 305 8333',
  },
  {
    destinationCode: 'JP',
    name: 'British Embassy Tokyo',
    address: '1 Ichiban-cho, Chiyoda-ku, Tokyo 102-8381',
    phone: '+81 3 5211 1100',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-embassy-tokyo',
    emergencyLine: '+81 3 5211 1100',
  },
  {
    destinationCode: 'US',
    name: 'British Embassy Washington',
    address: '3100 Massachusetts Avenue NW, Washington DC 20008',
    phone: '+1 202 588 6500',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-embassy-washington',
    emergencyLine: '+1 202 588 6500',
  },
  {
    destinationCode: 'AE',
    name: 'British Embassy Abu Dhabi',
    address: 'PO Box 248, Abu Dhabi, UAE',
    phone: '+971 2 610 1100',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-embassy-abu-dhabi',
    emergencyLine: '+971 2 610 1100',
  },
  {
    destinationCode: 'AU',
    name: 'British High Commission Canberra',
    address: 'Commonwealth Avenue, Yarralumla, ACT 2600',
    phone: '+61 2 6270 6666',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-high-commission-canberra',
    emergencyLine: '+61 2 6270 6666',
  },
  {
    destinationCode: 'IN',
    name: 'British High Commission New Delhi',
    address: 'Shantipath, Chanakyapuri, New Delhi 110021',
    phone: '+91 11 2419 2100',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-high-commission-new-delhi',
    emergencyLine: '+91 11 2419 2100',
  },
  {
    destinationCode: 'ZA',
    name: 'British High Commission Pretoria',
    address: '255 Hill Street, Arcadia, Pretoria 0028',
    phone: '+27 12 421 7500',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-high-commission-pretoria',
    emergencyLine: '+27 12 421 7500',
  },
  {
    destinationCode: 'KE',
    name: 'British High Commission Nairobi',
    address: 'Upper Hill Road, Nairobi',
    phone: '+254 20 2844 000',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-high-commission-nairobi',
    emergencyLine: '+254 20 2844 000',
  },
  {
    destinationCode: 'SG',
    name: 'British High Commission Singapore',
    address: '100 Tanglin Road, Singapore 247919',
    phone: '+65 6424 4200',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-high-commission-singapore',
    emergencyLine: '+65 6424 4200',
  },
  {
    destinationCode: 'VN',
    name: 'British Embassy Hanoi',
    address: '31 Hai Ba Trung, Hoan Kiem, Hanoi',
    phone: '+84 24 3936 0500',
    email: null,
    website: 'https://www.gov.uk/world/organisations/british-embassy-hanoi',
    emergencyLine: '+84 24 3936 0500',
  },
];
