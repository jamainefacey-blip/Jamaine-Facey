// VST Platform — Shared TypeScript Types
// Imported by both apps/web and apps/api

export type MembershipTier = 'GUEST' | 'PREMIUM' | 'VOYAGE_ELITE';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type BookingType = 'FLIGHT' | 'HOTEL' | 'PACKAGE';
export type SosStatus = 'ACTIVE' | 'ESCALATED' | 'RESOLVED' | 'FALSE_ALARM';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type VisaType = 'VISA_FREE' | 'VISA_ON_ARRIVAL' | 'E_VISA' | 'VISA_REQUIRED' | 'UNKNOWN';

// ── API Response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// ── Flight Search ─────────────────────────────────────────────────────────────
export interface FlightSearchParams {
  origin: string;        // IATA
  destination: string;   // IATA
  departureDate: string; // ISO date
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass: CabinClass;
  currency?: string;
}

export interface FlightResult {
  id: string;
  price: number;
  currency: string;
  carrier: string;
  carrierLogoUrl?: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  affiliateUrl: string;
  affiliateCode: string;
}

// ── Hotel Search ──────────────────────────────────────────────────────────────
export interface HotelSearchParams {
  destination: string;
  checkIn: string;       // ISO date
  checkOut: string;      // ISO date
  rooms: number;
  guests: number;
  currency?: string;
}

export interface HotelResult {
  id: string;
  name: string;
  destination: string;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  thumbnailUrl?: string;
  affiliateUrl: string;
  affiliateCode: string;
  amenities: string[];
  accessibilityFeatures: string[];
}

// ── SOS ───────────────────────────────────────────────────────────────────────
export interface SosTriggerPayload {
  triggerType: 'MANUAL';
  latitude?: number;
  longitude?: number;
  message?: string;
}

// ── Membership Plans ──────────────────────────────────────────────────────────
export interface MembershipPlan {
  tier: MembershipTier;
  name: string;
  monthlyPriceGBP: number;
  annualPriceGBP: number;
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: 'GUEST',
    name: 'Guest',
    monthlyPriceGBP: 0,
    annualPriceGBP: 0,
    features: [
      'Basic flight and hotel search',
      'Visa requirement lookup',
      'Embassy directory',
      'Basic SOS (email only)',
    ],
  },
  {
    tier: 'PREMIUM',
    name: 'Premium',
    monthlyPriceGBP: 9.99,
    annualPriceGBP: 89.99,
    features: [
      'Everything in Guest',
      'Price alerts (unlimited)',
      'SMS SOS notifications',
      'Timed check-in system',
      'Passport expiry alerts',
      'Up to 5 safety contacts',
      'Community reviews',
      'Explorer map access',
    ],
  },
  {
    tier: 'VOYAGE_ELITE',
    name: 'Voyage Elite',
    monthlyPriceGBP: 24.99,
    annualPriceGBP: 219.99,
    features: [
      'Everything in Premium',
      'Live location sharing',
      'Priority SOS escalation',
      'AI travel recommendations',
      'Concierge partner deals',
      'Unlimited safety contacts',
      'Early access to features',
    ],
  },
];
