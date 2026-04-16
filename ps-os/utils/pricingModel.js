'use strict';

const TIERS = {
  free: {
    name:           'free',
    requestsPerDay: 20,
    tokensPerDay:   10_000,
    pricePerMonth:  0,
  },
  pro: {
    name:           'pro',
    requestsPerDay: 500,
    tokensPerDay:   500_000,
    pricePerMonth:  29,
  },
  internal: {
    name:           'internal',
    requestsPerDay: Infinity,
    tokensPerDay:   Infinity,
    pricePerMonth:  0,
  },
};

const COST_PER_TOKEN = 0.000003; // $0.003 per 1k tokens (placeholder)

function getTier(name) {
  return TIERS[name] || TIERS.free;
}

function isWithinLimits(tierName, dailyRequests, dailyTokens) {
  const tier = getTier(tierName);
  return dailyRequests <= tier.requestsPerDay && dailyTokens <= tier.tokensPerDay;
}

function estimateCost(tokens) {
  return Number((tokens * COST_PER_TOKEN).toFixed(6));
}

function buildInvoiceLine(sessionId, tierName, tokens, requests) {
  const tier = getTier(tierName);
  return {
    sessionId,
    tier:      tier.name,
    tokens,
    requests,
    baseFee:   tier.pricePerMonth,
    usageFee:  estimateCost(tokens),
    total:     tier.pricePerMonth + estimateCost(tokens),
    currency:  'USD',
    period:    new Date().toISOString().slice(0, 7), // YYYY-MM
  };
}

module.exports = { getTier, isWithinLimits, estimateCost, buildInvoiceLine };
