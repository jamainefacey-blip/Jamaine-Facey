/**
 * VST Vercel Serverless — GET /v1/eco/calculate
 *
 * No authentication required — public calculation endpoint.
 * Query params: origin, destination, cabin_class, passengers
 * Returns: distance_km, co2_kg, co2_per_person_kg, eco_grade,
 *          offset_cost_gbp, emissions_factor, cabin_class, passengers
 */
'use strict';

const { calculate } = require('../server/eco-engine');

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  Object.keys(CORS).forEach(function (k) { res.setHeader(k, CORS[k]); });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  var params = req.method === 'POST' ? (req.body || {}) : (req.query || {});
  var origin      = params.origin      || params.o;
  var destination = params.destination || params.d;
  var cabinClass  = params.cabin_class || params.cabin || 'ECONOMY';
  var passengers  = params.passengers  || params.pax   || 1;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'MISSING_PARAMS', required: ['origin', 'destination'] });
  }

  var result = calculate(origin, destination, cabinClass, passengers);

  if (result.error === 'UNKNOWN_AIRPORT') {
    return res.status(422).json({ error: 'UNKNOWN_AIRPORT', detail: 'One or both IATA codes not found in the VST airport database.' });
  }

  return res.status(200).json(result);
};
