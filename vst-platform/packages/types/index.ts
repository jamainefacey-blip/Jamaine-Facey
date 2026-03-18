// VST Platform — Shared TypeScript Types
// VST identity: long-distance travel booking platform + local travel/discovery OS
// Imported by both apps/web and apps/api

export type MembershipTier = 'GUEST' | 'PREMIUM' | 'VOYAGE_ELITE';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
export type BookingType = 'FLIGHT' | 'HOTEL' | 'PACKAGE';
export type SosStatus = 'ACTIVE' | 'ESCALATED' | 'RESOLVED' | 'FALSE_ALARM';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
export type VisaType = 'VISA_FREE' | 'VISA_ON_ARRIVAL' | 'E_VISA' | 'VISA_REQUIRED' | 'UNKNOWN';
export type TravelMode = 'LONG_DISTANCE' | 'LOCAL';  // Both modes coexist; user never chooses

// ── API Response wrapper ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
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
  price: number;            // in smallest currency unit
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
  checkIn: string;
  checkOut: string;
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
  accessibilityFeatures: string[];  // first-class — never optional
}

// ── SOS ───────────────────────────────────────────────────────────────────────
export interface SosTriggerPayload {
  triggerType: 'MANUAL';
  latitude?: number;
  longitude?: number;
  message?: string;
}

// ── Local Discovery OS (deferred — schema + types ready now) ─────────────────
// VST operates as a local travel/discovery OS alongside long-distance booking.
// These types reserve the shape for Community + Explorer modules.

export interface LocalPin {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  mediaUrl?: string;
  tags: string[];
  authorId?: string;   // null = editorial pin
  isPublished: boolean;
}

export interface LocalArea {
  countryCode: string;
  countryName: string;
  region: string;
  pins: LocalPin[];
}

export interface LocalExperience {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category: LocalExperienceCategory;
  affiliateUrl?: string;
  accessibilityNotes?: string;
}

export type LocalExperienceCategory =
  | 'FOOD_DRINK'
  | 'CULTURE'
  | 'OUTDOOR'
  | 'TRANSPORT'
  | 'WELLNESS'
  | 'NIGHTLIFE'
  | 'FAMILY'
  | 'SHOPPING';

// ── Membership Plans (dual-identity: long-distance + local) ──────────────────
export interface MembershipPlanFeatures {
  longDistance: string[];
  local: string[];
  safety: string[];
  limits: {
    safetyContacts: number;   // -1 = unlimited
    priceAlerts: number;      // -1 = unlimited, 0 = none
    sosChannels: NotificationChannel[];
  };
}

export interface MembershipPlan {
  tier: MembershipTier;
  name: string;
  monthlyGBP: number;
  annualGBP: number;
  features: MembershipPlanFeatures;
  stripePriceIdMonthly?: string | null;
  stripePriceIdAnnual?: string | null;
}

// Canonical plan definitions — source of truth for frontend pricing page.
// Same data is also in MembershipService for server-side tier enforcement.
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: 'GUEST',
    name: 'Guest',
    monthlyGBP: 0,
    annualGBP: 0,
    features: {
      longDistance: [
        'Flight and hotel search (affiliate)',
        'Visa requirements lookup',
        'Embassy directory',
        'Booking history',
      ],
      local: [
        'Browse local explorer map',
        'View community pins',
      ],
      safety: [
        'SOS trigger (email notification only)',
        'Up to 2 safety contacts',
        'Manual check-in',
      ],
      limits: { safetyContacts: 2, priceAlerts: 0, sosChannels: ['EMAIL'] },
    },
  },
  {
    tier: 'PREMIUM',
    name: 'Premium',
    monthlyGBP: 9.99,
    annualGBP: 89.99,
    features: {
      longDistance: [
        'Everything in Guest',
        'Unlimited price alerts',
        'Passport expiry alerts',
        'Priority search results',
        'Booking confirmation emails',
      ],
      local: [
        'Save local spots (unlimited)',
        'Personalised local recommendations',
        'Exclusive local deals from partners',
        'Community review posting',
        'Submit explorer map pins',
      ],
      safety: [
        'SOS via email + SMS',
        'Up to 5 safety contacts',
        'Timed check-in system',
        'Check-in miss alerts to contacts',
      ],
      limits: { safetyContacts: 5, priceAlerts: -1, sosChannels: ['EMAIL', 'SMS'] },
    },
  },
  {
    tier: 'VOYAGE_ELITE',
    name: 'Voyage Elite',
    monthlyGBP: 24.99,
    annualGBP: 219.99,
    features: {
      longDistance: [
        'Everything in Premium',
        'AI travel recommendations (TwinAXIS)',
        'Travel continuity planning',
        'Concierge partner deals',
        'Early access to new features',
      ],
      local: [
        'Full local discovery OS access',
        'AI-powered local routing',
        'Local business rewards programme',
        'Offline local map cache',
        'Hyper-local event alerts',
      ],
      safety: [
        'SOS via email + SMS + push',
        'Unlimited safety contacts',
        'Live location sharing (SOS)',
        'Priority SOS escalation',
        'Dedicated safety profile',
      ],
      limits: { safetyContacts: -1, priceAlerts: -1, sosChannels: ['EMAIL', 'SMS', 'PUSH'] },
    },
  },
];
