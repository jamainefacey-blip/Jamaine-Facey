/* ─────────────────────────────────────────────────────────────────────────────
   VST Eco Engine — Client-side mirror of server/eco-engine.js
   window.VSTEco — carbon calculation, grading, badge logic.
   ───────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── Airport coordinates [lng, lat] — same encoding as server ───────────── */
  var AIRPORTS = {
    LHR:[-0.4614,51.4775],LGW:[-0.1903,51.1481],MAN:[-2.2750,53.3537],
    STN:[0.2389,51.8860], BHX:[-1.7480,52.4539],EDI:[-3.3615,55.9508],
    GLA:[-4.4331,55.8642],BRS:[-2.7191,51.3827],LTN:[-0.3683,51.8747],
    DUB:[-6.2701,53.4213],
    CDG:[2.5478,49.0097], ORY:[2.3794,48.7233], LYS:[5.0810,45.7256],
    NCE:[7.2159,43.6584], MRS:[5.2214,43.4393], AMS:[4.7683,52.3105],
    BRU:[4.4844,50.9010], FRA:[8.5622,50.0379], MUC:[11.7861,48.3538],
    BER:[13.5033,52.3667],DUS:[6.7668,51.2895], HAM:[10.0065,53.6304],
    ZRH:[8.5492,47.4647], GVA:[6.1090,46.2380], VIE:[16.5697,48.1103],
    PRG:[14.2600,50.1008],BUD:[19.2611,47.4298],WAW:[20.9671,52.1657],
    MAD:[-3.5626,40.4719],BCN:[2.0785,41.2971], LIS:[-9.1342,38.7742],
    OPO:[-8.6814,41.2481],AGP:[-4.4991,36.6749],PMI:[2.7388,39.5517],
    FCO:[12.2389,41.8003],MXP:[8.7281,45.6306], VCE:[12.3519,45.5053],
    NAP:[14.2908,40.8860],ATH:[23.9445,37.9364],
    CPH:[12.6561,55.6180],ARN:[17.9186,59.6519],OSL:[11.1004,60.1939],
    HEL:[24.9633,60.3172],
    IST:[28.7519,41.2753],SAW:[29.3092,40.8986],
    DXB:[55.3657,25.2532],AUH:[54.6511,24.4330],DOH:[51.6138,25.2609],
    KWI:[47.9689,29.2267],BAH:[50.6336,26.2708],MCT:[58.2844,23.5933],
    RUH:[46.6988,24.9597],BEY:[35.4883,33.8209],AMM:[35.9932,31.7226],
    TLV:[34.8854,31.9965],
    CAI:[31.4056,30.1219],CMN:[-7.5900,33.3675],
    CPT:[18.6017,-33.9648],JNB:[28.2460,-26.1392],NBO:[36.9275,-1.3192],
    ADD:[38.7990,8.9779], LOS:[3.3212,6.5774],  MRU:[57.6836,-20.4302],
    DAR:[39.2026,-6.8781],
    DME:[37.9026,55.4103],SVO:[37.4146,55.9726],LED:[30.2625,59.8003],
    DEL:[77.1000,28.5562],BOM:[72.8656,19.0896],MAA:[80.1693,12.9900],
    CCU:[88.4467,22.6543],BLR:[77.7063,13.1979],HYD:[78.4298,17.2313],
    CMB:[79.8841,7.1808], DAC:[90.3978,23.8433],KTM:[85.3591,27.6966],
    KHI:[67.1608,24.9065],LHE:[74.4036,31.5216],ISB:[73.0997,33.6167],
    MLE:[73.5290,4.1918],
    SIN:[103.9940,1.3502],BKK:[100.7475,13.6811],KUL:[101.7099,2.7456],
    CGK:[106.6559,-6.1256],DPS:[115.1670,-8.7467],HAN:[105.8072,21.2212],
    SGN:[106.6520,10.8188],MNL:[121.0194,14.5086],
    NRT:[140.3856,35.7653],HND:[139.7798,35.5494],KIX:[135.2440,34.4272],
    PEK:[116.6031,40.0799],PVG:[121.8083,31.1443],HKG:[113.9185,22.3080],
    ICN:[126.4407,37.4602],TPE:[121.2327,25.0777],
    JFK:[-73.7781,40.6413],EWR:[-74.1745,40.6895],BOS:[-71.0096,42.3656],
    IAD:[-77.4565,38.9531],PHL:[-75.2424,39.8744],ORD:[-87.9073,41.9742],
    ATL:[-84.4277,33.6407],MIA:[-80.2870,25.7959],TPA:[-82.5332,27.9755],
    MCO:[-81.3081,28.4312],CLT:[-80.9431,35.2140],BWI:[-76.6684,39.1754],
    LAX:[-118.4081,33.9425],SFO:[-122.3790,37.6213],SEA:[-122.3088,47.4502],
    LAS:[-115.1537,36.0840],PHX:[-112.0078,33.4373],DEN:[-104.6737,39.8561],
    IAH:[-95.3368,29.9902],DFW:[-97.0403,32.8998],MSP:[-93.2223,44.8848],
    DTW:[-83.3534,42.2124],YYZ:[-79.6248,43.6777],YVR:[-123.1839,49.1947],
    YUL:[-73.7408,45.4706],HNL:[-157.9251,21.3245],
    MEX:[-99.0721,19.4363],CUN:[-86.8771,21.0365],BOG:[-74.1469,4.7016],
    LIM:[-77.1143,-12.0219],GRU:[-46.4731,-23.4356],SCL:[-70.7858,-33.3930],
    EZE:[-58.5358,-34.8222],
    SYD:[151.1753,-33.9399],MEL:[144.8410,-37.6690],BNE:[153.1175,-27.3842],
    PER:[115.9670,-31.9403],AKL:[174.7850,-37.0082],
  };

  var FACTORS = { ECONOMY:0.133, PREMIUM_ECONOMY:0.200, BUSINESS:0.320, FIRST:0.532 };
  var OFFSET_RATE = 0.015;

  function haversine(lon1, lat1, lon2, lat2) {
    var R = 6371, d2r = Math.PI / 180;
    var dLat = (lat2 - lat1) * d2r, dLon = (lon2 - lon1) * d2r;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2)
          + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }

  function ecoGrade(co2PerPerson) {
    if (co2PerPerson <  50) return 'A';
    if (co2PerPerson < 150) return 'B';
    if (co2PerPerson < 350) return 'C';
    if (co2PerPerson < 600) return 'D';
    return 'E';
  }

  function ecoGradeClass(grade) {
    return { A:'eco-grade--a', B:'eco-grade--b', C:'eco-grade--c', D:'eco-grade--d', E:'eco-grade--e' }[grade] || '';
  }

  function badgeForCount(count) {
    if (count >= 25) return { id:'PLATINUM', label:'Platinum', next:null,       next_count:null, progress:1,                  colour:'#c4b5fd' };
    if (count >= 10) return { id:'GOLD',     label:'Gold',     next:'Platinum', next_count:25,   progress:(count-10)/15,      colour:'#fde68a' };
    if (count >= 5)  return { id:'SILVER',   label:'Silver',   next:'Gold',     next_count:10,   progress:(count-5)/5,        colour:'#e2e8f0' };
    if (count >= 1)  return { id:'BRONZE',   label:'Bronze',   next:'Silver',   next_count:5,    progress:(count-1)/4,        colour:'#fcd34d' };
    return               { id:null,       label:null,       next:'Bronze',   next_count:1,    progress:0,                  colour:null };
  }

  function calculate(origin, destination, cabinClass, passengers) {
    var cabin = ((cabinClass || 'ECONOMY') + '').toUpperCase().replace(/[\s-]/g, '_');
    var pax   = Math.max(1, parseInt(passengers, 10) || 1);
    var oKey  = (origin      + '').toUpperCase();
    var dKey  = (destination + '').toUpperCase();
    var oC    = AIRPORTS[oKey], dC = AIRPORTS[dKey];
    if (!oC || !dC) return { error:'UNKNOWN_AIRPORT', eco_grade:null, co2_kg:null, co2_per_person_kg:null, distance_km:null };
    var factor       = FACTORS[cabin] || FACTORS.ECONOMY;
    var distKm       = haversine(oC[0], oC[1], dC[0], dC[1]);
    var co2PerPerson = Math.round(distKm * factor);
    var co2Total     = co2PerPerson * pax;
    return {
      origin: oKey, destination: dKey, cabin_class: cabin, passengers: pax,
      distance_km: distKm, emissions_factor: factor,
      co2_per_person_kg: co2PerPerson, co2_kg: co2Total,
      eco_grade: ecoGrade(co2PerPerson),
      offset_cost_gbp: Math.round(co2Total * OFFSET_RATE * 100) / 100,
    };
  }

  window.VSTEco = { calculate, ecoGrade, ecoGradeClass, badgeForCount, AIRPORTS };
})();
