/**
 * VST Eco Engine — Phase 3.5
 *
 * ICAO-methodology carbon calculation.
 * Emission factors: economy 0.133 kg/km, premium_economy 0.200,
 * business 0.320, first 0.532.
 * Eco grade thresholds per person (one-way flight).
 * Offset cost: £0.015 / kg CO2.
 */
'use strict';

/* ── Airport coordinates [lat, lng] ─────────────────────────────────────── */
const AIRPORTS = {
  // UK & Ireland
  LHR:[-0.4614,51.4775], LGW:[-0.1903,51.1481], MAN:[-2.2750,53.3537],
  STN:[0.2389,51.8860],  BHX:[-1.7480,52.4539], EDI:[-3.3615,55.9508],
  GLA:[-4.4331,55.8642], BRS:[-2.7191,51.3827], LTN:[-0.3683,51.8747],
  DUB:[-6.2701,53.4213],
  // Western Europe
  CDG:[2.5478,49.0097],  ORY:[2.3794,48.7233],  LYS:[5.0810,45.7256],
  NCE:[7.2159,43.6584],  MRS:[5.2214,43.4393],  NTE:[-1.6103,47.1531],
  AMS:[4.7683,52.3105],  BRU:[4.4844,50.9010],  LUX:[6.2044,49.6233],
  FRA:[8.5622,50.0379],  MUC:[11.7861,48.3538], BER:[13.5033,52.3667],
  DUS:[6.7668,51.2895],  HAM:[10.0065,53.6304], STR:[9.2219,48.6902],
  CGN:[7.1427,50.8659],  NUE:[11.0669,49.4987], HAJ:[9.6850,52.4611],
  ZRH:[8.5492,47.4647],  GVA:[6.1090,46.2380],  BSL:[7.5299,47.5896],
  VIE:[16.5697,48.1103], PRG:[14.2600,50.1008], BUD:[19.2611,47.4298],
  WAW:[20.9671,52.1657], KRK:[19.7848,50.0777], WRO:[16.8858,51.1071],
  // Iberian
  MAD:[-3.5626,40.4719], BCN:[2.0785,41.2971],  LIS:[-9.1342,38.7742],
  OPO:[-8.6814,41.2481], AGP:[-4.4991,36.6749], SVQ:[-5.8931,37.4179],
  PMI:[2.7388,39.5517],
  // Italy & Greece
  FCO:[12.2389,41.8003], MXP:[8.7281,45.6306],  VCE:[12.3519,45.5053],
  NAP:[14.2908,40.8860], BRI:[16.7606,41.1389],  ATH:[23.9445,37.9364],
  SKG:[22.9709,40.5197], HER:[25.1803,35.3397],
  // Scandinavia & Baltic
  CPH:[12.6561,55.6180], ARN:[17.9186,59.6519], OSL:[11.1004,60.1939],
  BGO:[5.2181,60.2934],  HEL:[24.9633,60.3172], TMP:[23.6043,61.4142],
  RIG:[23.9711,56.9236], TLL:[24.8328,59.4133], VNO:[25.2858,54.6341],
  // Turkey & Eastern Europe
  IST:[28.7519,41.2753], SAW:[29.3092,40.8986], ADB:[27.1571,38.2924],
  OTP:[26.0852,44.5711], SOF:[23.4114,42.6967], BEG:[20.3091,44.8184],
  ZAG:[16.0688,45.7429], SKP:[21.6214,41.9614],
  // Middle East
  DXB:[55.3657,25.2532], AUH:[54.6511,24.4330], DOH:[51.6138,25.2609],
  KWI:[47.9689,29.2267], BAH:[50.6336,26.2708], MCT:[58.2844,23.5933],
  RUH:[46.6988,24.9597], BEY:[35.4883,33.8209], AMM:[35.9932,31.7226],
  TLV:[34.8854,31.9965], KHM:[46.1128,14.4667],
  // Africa
  CAI:[31.4056,30.1219], CMN:[-7.5900,33.3675], TUN:[10.2272,36.8510],
  ALG:[3.2154,36.6910],  RAK:[-8.0363,31.6069], TNG:[-5.9189,35.7267],
  CPT:[18.6017,-33.9648],JNB:[28.2460,-26.1392],NBO:[36.9275,-1.3192],
  ADD:[38.7990,8.9779],  LOS:[3.3212,6.5774],   ABV:[7.2631,9.0068],
  ACC:[-0.1668,5.6052],  DAR:[39.2026,-6.8781], MRU:[57.6836,-20.4302],
  RBA:[-6.7515,33.9864], TIP:[13.1590,32.6635], KRT:[32.5532,15.5895],
  // Russia & Central Asia
  DME:[37.9026,55.4103], SVO:[37.4146,55.9726], LED:[30.2625,59.8003],
  AER:[39.9566,43.4499], TAS:[69.2819,41.2579], ALA:[77.0405,43.3521],
  // South Asia
  DEL:[77.1000,28.5562], BOM:[72.8656,19.0896], MAA:[80.1693,12.9900],
  CCU:[88.4467,22.6543], BLR:[77.7063,13.1979], HYD:[78.4298,17.2313],
  COK:[76.4019,10.1520], CMB:[79.8841,7.1808],  DAC:[90.3978,23.8433],
  KTM:[85.3591,27.6966], KHI:[67.1608,24.9065], LHE:[74.4036,31.5216],
  ISB:[73.0997,33.6167], MLE:[73.5290,4.1918],
  // Southeast Asia
  SIN:[103.9940,1.3502], BKK:[100.7475,13.6811],KUL:[101.7099,2.7456],
  CGK:[106.6559,-6.1256],DPS:[115.1670,-8.7467],HAN:[105.8072,21.2212],
  SGN:[106.6520,10.8188],MNL:[121.0194,14.5086],RGN:[96.1331,16.9073],
  // East Asia
  NRT:[140.3856,35.7653],HND:[139.7798,35.5494],KIX:[135.2440,34.4272],
  FUK:[130.4508,33.5853],PEK:[116.6031,40.0799],PVG:[121.8083,31.1443],
  SHA:[121.3362,31.1981],CAN:[113.2988,23.3925],HKG:[113.9185,22.3080],
  ICN:[126.4407,37.4602],GMP:[126.7944,37.5585],TPE:[121.2327,25.0777],
  MFM:[113.5920,22.1496],
  // North America
  JFK:[-73.7781,40.6413],EWR:[-74.1745,40.6895],BOS:[-71.0096,42.3656],
  IAD:[-77.4565,38.9531],DCA:[-77.0377,38.8521],PHL:[-75.2424,39.8744],
  ORD:[-87.9073,41.9742],MID:[-89.6577,20.9369],DTW:[-83.3534,42.2124],
  ATL:[-84.4277,33.6407],MIA:[-80.2870,25.7959],TPA:[-82.5332,27.9755],
  MCO:[-81.3081,28.4312],CLT:[-80.9431,35.2140],BWI:[-76.6684,39.1754],
  LAX:[-118.4081,33.9425],SFO:[-122.3790,37.6213],SEA:[-122.3088,47.4502],
  LAS:[-115.1537,36.0840],PHX:[-112.0078,33.4373],SAN:[-117.1897,32.7336],
  DEN:[-104.6737,39.8561],IAH:[-95.3368,29.9902],DFW:[-97.0403,32.8998],
  MSP:[-93.2223,44.8848],YYZ:[-79.6248,43.6777],YVR:[-123.1839,49.1947],
  YUL:[-73.7408,45.4706],YYC:[-114.0106,51.1315],HNL:[-157.9251,21.3245],
  ANC:[-149.9981,61.1744],
  // Caribbean & Latin America
  MEX:[-99.0721,19.4363],CUN:[-86.8771,21.0365],SJO:[-84.2088,9.9939],
  BOG:[-74.1469,4.7016], LIM:[-77.1143,-12.0219],GRU:[-46.4731,-23.4356],
  GIG:[-43.2506,-22.8099],SCL:[-70.7858,-33.3930],EZE:[-58.5358,-34.8222],
  UIO:[-78.3576,-0.1291], HAV:[-82.4091,22.9892],
  // Oceania
  SYD:[151.1753,-33.9399],MEL:[144.8410,-37.6690],BNE:[153.1175,-27.3842],
  PER:[115.9670,-31.9403],ADL:[138.5308,-34.9457],AKL:[174.7850,-37.0082],
  CHC:[172.5324,-43.4893],NAN:[177.4431,-17.7554],PPT:[-149.6067,-17.5534],
};

/* ── ICAO emission factors kg CO2 per km per passenger ──────────────────── */
const FACTORS = {
  ECONOMY:          0.133,
  PREMIUM_ECONOMY:  0.200,
  BUSINESS:         0.320,
  FIRST:            0.532,
};

const OFFSET_RATE = 0.015; /* £ per kg CO2 */

/* ── Eco grade thresholds (per person, one-way) ─────────────────────────── */
function ecoGrade(co2PerPerson) {
  if (co2PerPerson <  50)  return 'A';
  if (co2PerPerson < 150)  return 'B';
  if (co2PerPerson < 350)  return 'C';
  if (co2PerPerson < 600)  return 'D';
  return 'E';
}

/* ── Haversine great-circle distance ────────────────────────────────────── */
function haversine(lon1, lat1, lon2, lat2) {
  var R    = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
           + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
           * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ── Milestone badge for offset purchase count ──────────────────────────── */
function badgeForCount(count) {
  if (count >= 25) return { id: 'PLATINUM', label: 'Platinum', next: null,      next_count: null, progress: 1,                    colour: '#c4b5fd' };
  if (count >= 10) return { id: 'GOLD',     label: 'Gold',     next: 'Platinum', next_count: 25,   progress: (count - 10) / 15,   colour: '#fde68a' };
  if (count >= 5)  return { id: 'SILVER',   label: 'Silver',   next: 'Gold',     next_count: 10,   progress: (count - 5)  / 5,    colour: '#e2e8f0' };
  if (count >= 1)  return { id: 'BRONZE',   label: 'Bronze',   next: 'Silver',   next_count: 5,    progress: (count - 1)  / 4,    colour: '#fcd34d' };
  return               { id: null,       label: null,       next: 'Bronze',   next_count: 1,    progress: 0,                   colour: null };
}

/* ── Main calculate function ─────────────────────────────────────────────── */
function calculate(origin, destination, cabinClass, passengers) {
  var cabin = ((cabinClass || 'ECONOMY') + '').toUpperCase().replace(/[\s-]/g, '_');
  var pax   = Math.max(1, parseInt(passengers, 10) || 1);
  var oKey  = (origin      + '').toUpperCase();
  var dKey  = (destination + '').toUpperCase();

  var oCoord = AIRPORTS[oKey];
  var dCoord = AIRPORTS[dKey];

  if (!oCoord || !dCoord) {
    return { origin: oKey, destination: dKey, cabin_class: cabin, passengers: pax,
             error: 'UNKNOWN_AIRPORT', distance_km: null, co2_kg: null,
             co2_per_person_kg: null, eco_grade: null, offset_cost_gbp: null };
  }

  var factor       = FACTORS[cabin] || FACTORS.ECONOMY;
  var distanceKm   = haversine(oCoord[0], oCoord[1], dCoord[0], dCoord[1]);
  var co2PerPerson = Math.round(distanceKm * factor);
  var co2Total     = co2PerPerson * pax;
  var grade        = ecoGrade(co2PerPerson);
  var offsetCost   = Math.round(co2Total * OFFSET_RATE * 100) / 100;

  return {
    origin:            oKey,
    destination:       dKey,
    cabin_class:       cabin,
    passengers:        pax,
    distance_km:       distanceKm,
    emissions_factor:  factor,
    co2_per_person_kg: co2PerPerson,
    co2_kg:            co2Total,
    eco_grade:         grade,
    offset_cost_gbp:   offsetCost,
  };
}

module.exports = { calculate, ecoGrade, haversine, badgeForCount, AIRPORTS, FACTORS, OFFSET_RATE };
