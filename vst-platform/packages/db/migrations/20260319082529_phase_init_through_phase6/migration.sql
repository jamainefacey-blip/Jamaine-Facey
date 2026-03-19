-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('BUDGET', 'MODERATE', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "TravelStyle" AS ENUM ('ADVENTURE', 'LUXURY', 'CULTURAL', 'BEACH', 'FAMILY', 'SOLO', 'BUSINESS', 'BACKPACKER');

-- CreateEnum
CREATE TYPE "DestinationPrefType" AS ENUM ('PREFERRED', 'DREAM', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('SHORT_BREAK', 'WEEKEND', 'WEEK_HOLIDAY', 'LONG_HAUL', 'BACKPACKING', 'CITY_BREAK', 'CRUISE', 'ROAD_TRIP', 'LAST_MINUTE', 'LONG_WAY_ROUND');

-- CreateEnum
CREATE TYPE "StayType" AS ENUM ('HOTEL', 'HOSTEL', 'APARTMENT', 'VILLA', 'CAMPING', 'BOUTIQUE', 'ALL_INCLUSIVE');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'FERRY', 'DRIVE');

-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('CONFIRMED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('LOCAL_DISCOVERY', 'SHORT_BREAK', 'WEEK_HOLIDAY', 'LONG_HAUL', 'LAST_MINUTE', 'LONG_WAY_ROUND', 'PRICE_DROP_MATCH');

-- CreateEnum
CREATE TYPE "SosStatus" AS ENUM ('ACTIVE', 'ESCALATED', 'RESOLVED', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "SosTrigger" AS ENUM ('MANUAL', 'CHECKIN_MISSED', 'ESCALATION');

-- CreateEnum
CREATE TYPE "VisaType" AS ENUM ('VISA_FREE', 'VISA_ON_ARRIVAL', 'E_VISA', 'VISA_REQUIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('GUEST', 'PREMIUM', 'VOYAGE_ELITE');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SUBSCRIPTION', 'BOOKING_DEPOSIT', 'AFFILIATE_COMMISSION');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('FLIGHT', 'HOTEL', 'PACKAGE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SOS_ALERT', 'CHECKIN_REMINDER', 'PRICE_ALERT', 'BOOKING_CONFIRMATION', 'PASSPORT_EXPIRY', 'TRAVEL_ADVISORY', 'MEMBERSHIP_RENEWAL', 'OPPORTUNITY_MATCH', 'TRAVEL_RADAR', 'LOCAL_DISCOVERY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'FLAGGED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('HOTEL', 'AIRLINE', 'TOUR_OPERATOR', 'INSURANCE', 'EXPERIENCE', 'TRANSPORT', 'TECHNOLOGY');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "LocalEventCategory" AS ENUM ('FOOD_DRINK', 'CULTURE', 'OUTDOOR', 'TRANSPORT', 'WELLNESS', 'NIGHTLIFE', 'FAMILY', 'SHOPPING', 'SPORT', 'MUSIC', 'ART', 'FESTIVAL');

-- CreateEnum
CREATE TYPE "RadarSignalType" AS ENUM ('PRICE_DROP', 'TRENDING_DEST', 'EVENT_CLUSTER', 'VIRAL_PIN', 'VISA_CHANGE', 'SAFETY_CHANGE');

-- CreateEnum
CREATE TYPE "LongWayRoundStatus" AS ENUM ('DRAFT', 'PLANNED', 'BOOKED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "nationality" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "preferredCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "budgetRange" "BudgetRange" NOT NULL DEFAULT 'MODERATE',
    "budgetMinGbp" INTEGER,
    "budgetMaxGbp" INTEGER,
    "travelStyle" "TravelStyle"[],
    "tripTypes" "TripType"[],
    "stayTypes" "StayType"[],
    "transportModes" "TransportMode"[],
    "minTripDays" INTEGER,
    "maxTripDays" INTEGER,
    "requiresWheelchair" BOOLEAN NOT NULL DEFAULT false,
    "requiresAssistance" BOOLEAN NOT NULL DEFAULT false,
    "dietaryRequirements" TEXT[],
    "accessibilityNotes" TEXT,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "smsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "priceAlertThreshold" DOUBLE PRECISION,
    "opportunityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "lastMinuteAlerts" BOOLEAN NOT NULL DEFAULT false,
    "longWayRoundAlerts" BOOLEAN NOT NULL DEFAULT false,
    "travelRadarAlerts" BOOLEAN NOT NULL DEFAULT true,
    "localDiscoveryAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_destination_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "type" "DestinationPrefType" NOT NULL,
    "note" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_destination_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_availability_windows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isFlexible" BOOLEAN NOT NULL DEFAULT false,
    "flexDaysBefore" INTEGER NOT NULL DEFAULT 0,
    "flexDaysAfter" INTEGER NOT NULL DEFAULT 0,
    "minTripDays" INTEGER,
    "maxTripDays" INTEGER,
    "windowType" "AvailabilityType" NOT NULL DEFAULT 'TENTATIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_availability_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnSos" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnCheckin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SosStatus" NOT NULL DEFAULT 'ACTIVE',
    "triggerType" "SosTrigger" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "message" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sos_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_contact_notifications" (
    "id" TEXT NOT NULL,
    "sosEventId" TEXT NOT NULL,
    "safetyContactId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sos_contact_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sosEventId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "note" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "passportNumber" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "alertDaysBefore" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visa_requirements" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "passportNationality" TEXT NOT NULL,
    "visaType" "VisaType" NOT NULL,
    "maxStayDays" INTEGER,
    "notes" TEXT,
    "officialUrl" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visa_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embassies" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "emergencyLine" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embassies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "MembershipTier" NOT NULL DEFAULT 'GUEST',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "tier" "MembershipTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" "PaymentStatus" NOT NULL,
    "type" "PaymentType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "externalRef" TEXT,
    "affiliateCode" TEXT,
    "rawSearchParams" JSONB,
    "priceSnapshot" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "totalAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_bookings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "returnDepartureAt" TIMESTAMP(3),
    "returnArrivalAt" TIMESTAMP(3),
    "cabinClass" "CabinClass" NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "infants" INTEGER NOT NULL DEFAULT 0,
    "carrier" TEXT,
    "flightNumbers" TEXT[],

    CONSTRAINT "flight_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_bookings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hotelId" TEXT,
    "hotelName" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "rooms" INTEGER NOT NULL DEFAULT 1,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "roomType" TEXT,

    CONSTRAINT "hotel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "origin" TEXT,
    "destination" TEXT NOT NULL,
    "targetPrice" INTEGER,
    "thresholdPct" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "travelDate" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderationNotes" TEXT,
    "moderationBy" TEXT,
    "replyBody" TEXT,
    "replyAt" TIMESTAMP(3),
    "replyBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_media" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isAccessibilityEvidence" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explorer_pins" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "mediaUrl" TEXT,
    "mediaType" "MediaType",
    "mediaConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "explorer_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_campaigns" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "commissionPct" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "trackingCode" TEXT NOT NULL,
    "platform" TEXT,
    "commissionPct" DOUBLE PRECISION NOT NULL,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalConversions" INTEGER NOT NULL DEFAULT 0,
    "totalEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "category" "LocalEventCategory" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "affiliateUrl" TEXT,
    "ticketUrl" TEXT,
    "organizerId" TEXT,
    "accessibilityFeatures" TEXT[],
    "tags" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_signals" (
    "id" TEXT NOT NULL,
    "type" "RadarSignalType" NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "destinationName" TEXT,
    "payload" JSONB NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 50,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "long_way_round_routes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "status" "LongWayRoundStatus" NOT NULL DEFAULT 'DRAFT',
    "totalDays" INTEGER,
    "budgetGbp" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "long_way_round_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "long_way_round_stops" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "destinationName" TEXT,
    "durationDays" INTEGER,
    "arrivalAfter" TIMESTAMP(3),
    "isFlexible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "long_way_round_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_destination_preferences_userId_destinationCode_type_key" ON "user_destination_preferences"("userId", "destinationCode", "type");

-- CreateIndex
CREATE UNIQUE INDEX "passports_userId_key" ON "passports"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_countryCode_key" ON "destinations"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "visa_requirements_destinationId_passportNationality_key" ON "visa_requirements"("destinationId", "passportNationality");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_key" ON "memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON "payments"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "flight_bookings_bookingId_key" ON "flight_bookings"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_bookings_bookingId_key" ON "hotel_bookings"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_trackingCode_key" ON "affiliates"("trackingCode");

-- CreateIndex
CREATE INDEX "radar_signals_destinationCode_idx" ON "radar_signals"("destinationCode");

-- CreateIndex
CREATE INDEX "radar_signals_type_createdAt_idx" ON "radar_signals"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "long_way_round_stops_routeId_position_key" ON "long_way_round_stops"("routeId", "position");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_destination_preferences" ADD CONSTRAINT "user_destination_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_availability_windows" ADD CONSTRAINT "user_availability_windows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_contacts" ADD CONSTRAINT "safety_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_contact_notifications" ADD CONSTRAINT "sos_contact_notifications_sosEventId_fkey" FOREIGN KEY ("sosEventId") REFERENCES "sos_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sos_contact_notifications" ADD CONSTRAINT "sos_contact_notifications_safetyContactId_fkey" FOREIGN KEY ("safetyContactId") REFERENCES "safety_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_sosEventId_fkey" FOREIGN KEY ("sosEventId") REFERENCES "sos_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passports" ADD CONSTRAINT "passports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visa_requirements" ADD CONSTRAINT "visa_requirements_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embassies" ADD CONSTRAINT "embassies_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explorer_pins" ADD CONSTRAINT "explorer_pins_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_campaigns" ADD CONSTRAINT "partner_campaigns_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "partner_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_way_round_routes" ADD CONSTRAINT "long_way_round_routes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "long_way_round_stops" ADD CONSTRAINT "long_way_round_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "long_way_round_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
