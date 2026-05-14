/* safety-data.js — static safety data for VST Safety Engine */
(function () {
  'use strict';

  window.VST_SAFETY_DATA = {

    /* ── Local emergency numbers ─────────────────────────────────── */
    emergencyNumbers: {
      france: { police: '17', ambulance: '15', fire: '18', general: '112' },
      spain: { police: '091', ambulance: '061', fire: '080', general: '112' },
      italy: { police: '112', ambulance: '118', fire: '115', general: '112' },
      portugal: { police: '112', ambulance: '112', fire: '112', general: '112' },
      greece: { police: '100', ambulance: '166', fire: '199', general: '112' },
      germany: { police: '110', ambulance: '112', fire: '112', general: '112' },
      netherlands: { police: '0900-8844', ambulance: '112', fire: '112', general: '112' },
      belgium: { police: '101', ambulance: '100', fire: '100', general: '112' },
      austria: { police: '133', ambulance: '144', fire: '122', general: '112' },
      switzerland: { police: '117', ambulance: '144', fire: '118', general: '112' },
      sweden: { police: '114 14', ambulance: '112', fire: '112', general: '112' },
      norway: { police: '112', ambulance: '113', fire: '110', general: '112' },
      denmark: { police: '114', ambulance: '112', fire: '112', general: '112' },
      finland: { police: '112', ambulance: '112', fire: '112', general: '112' },
      iceland: { police: '112', ambulance: '112', fire: '112', general: '112' },
      ireland: { police: '999', ambulance: '999', fire: '999', general: '112' },
      czech_republic: { police: '158', ambulance: '155', fire: '150', general: '112' },
      poland: { police: '997', ambulance: '999', fire: '998', general: '112' },
      hungary: { police: '107', ambulance: '104', fire: '105', general: '112' },
      romania: { police: '112', ambulance: '112', fire: '112', general: '112' },
      croatia: { police: '192', ambulance: '194', fire: '193', general: '112' },
      turkey: { police: '155', ambulance: '112', fire: '110', general: '112' },
      usa: { police: '911', ambulance: '911', fire: '911', general: '911' },
      canada: { police: '911', ambulance: '911', fire: '911', general: '911' },
      mexico: { police: '911', ambulance: '911', fire: '911', general: '911' },
      brazil: { police: '190', ambulance: '192', fire: '193', general: '190' },
      argentina: { police: '911', ambulance: '107', fire: '100', general: '911' },
      peru: { police: '105', ambulance: '106', fire: '116', general: '105' },
      colombia: { police: '123', ambulance: '125', fire: '119', general: '123' },
      costa_rica: { police: '911', ambulance: '911', fire: '911', general: '911' },
      japan: { police: '110', ambulance: '119', fire: '119', general: '110' },
      thailand: { police: '191', ambulance: '1669', fire: '199', general: '191' },
      indonesia: { police: '110', ambulance: '118', fire: '113', general: '112' },
      vietnam: { police: '113', ambulance: '115', fire: '114', general: '113' },
      malaysia: { police: '999', ambulance: '999', fire: '994', general: '999' },
      singapore: { police: '999', ambulance: '995', fire: '995', general: '999' },
      india: { police: '100', ambulance: '102', fire: '101', general: '112' },
      sri_lanka: { police: '119', ambulance: '110', fire: '111', general: '119' },
      maldives: { police: '119', ambulance: '102', fire: '118', general: '119' },
      uae: { police: '999', ambulance: '998', fire: '997', general: '999' },
      australia: { police: '000', ambulance: '000', fire: '000', general: '000' },
      new_zealand: { police: '111', ambulance: '111', fire: '111', general: '111' },
      south_africa: { police: '10111', ambulance: '10177', fire: '10177', general: '112' },
      kenya: { police: '999', ambulance: '999', fire: '999', general: '999' },
      tanzania: { police: '999', ambulance: '999', fire: '114', general: '999' },
      morocco: { police: '19', ambulance: '15', fire: '15', general: '19' },
      egypt: { police: '122', ambulance: '123', fire: '180', general: '122' },
      ghana: { police: '191', ambulance: '193', fire: '192', general: '191' },
      jordan: { police: '911', ambulance: '911', fire: '911', general: '911' },
      israel: { police: '100', ambulance: '101', fire: '102', general: '100' }
    },

    /* ── Embassy / High Commission data (UK) ─────────────────────── */
    embassies: {
      france: {
        country: 'France', flag: '🇫🇷', continent: 'Europe',
        name: 'British Embassy Paris',
        address: '35 rue du Faubourg St Honoré, 75363 Paris CEDEX 08',
        phone: '+33 1 44 51 31 00', email: 'ukinfrance.general@fco.gov.uk',
        hours: 'Mon–Fri 09:30–16:30'
      },
      spain: {
        country: 'Spain', flag: '🇪🇸', continent: 'Europe',
        name: 'British Embassy Madrid',
        address: 'Torre Espacio, Paseo de la Castellana 259D, 28046 Madrid',
        phone: '+34 91 714 6300', email: 'consular.madrid@fco.gov.uk',
        hours: 'Mon–Fri 08:30–13:30'
      },
      italy: {
        country: 'Italy', flag: '🇮🇹', continent: 'Europe',
        name: 'British Embassy Rome',
        address: 'Via XX Settembre 80a, 00187 Roma',
        phone: '+39 06 4220 0001', email: 'consularenquiries.rome@fco.gov.uk',
        hours: 'Mon–Fri 09:00–13:00'
      },
      portugal: {
        country: 'Portugal', flag: '🇵🇹', continent: 'Europe',
        name: 'British Embassy Lisbon',
        address: 'Rua de São Bernardo 33, 1249-082 Lisbon',
        phone: '+351 21 392 4000', email: 'consularenquiries.lisbon@fco.gov.uk',
        hours: 'Mon–Fri 09:30–16:00'
      },
      greece: {
        country: 'Greece', flag: '🇬🇷', continent: 'Europe',
        name: 'British Embassy Athens',
        address: '1 Ploutarchou Street, 106 75 Athens',
        phone: '+30 210 727 2600', email: 'britishembassyathens@fco.gov.uk',
        hours: 'Mon–Fri 08:00–15:30'
      },
      germany: {
        country: 'Germany', flag: '🇩🇪', continent: 'Europe',
        name: 'British Embassy Berlin',
        address: 'Wilhelmstraße 70-71, 10117 Berlin',
        phone: '+49 30 204 570', email: 'info@britischebotschaft.de',
        hours: 'Mon–Fri 09:00–17:00'
      },
      netherlands: {
        country: 'Netherlands', flag: '🇳🇱', continent: 'Europe',
        name: 'British Embassy The Hague',
        address: 'Lange Voorhout 10, 2514 ED The Hague',
        phone: '+31 70 427 0427', email: 'consular.thehague@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      belgium: {
        country: 'Belgium', flag: '🇧🇪', continent: 'Europe',
        name: 'British Embassy Brussels',
        address: 'Avenue d\'Auderghem 10, 1040 Brussels',
        phone: '+32 2 287 6211', email: 'britishembassybrussels@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      austria: {
        country: 'Austria', flag: '🇦🇹', continent: 'Europe',
        name: 'British Embassy Vienna',
        address: 'Jaurèsgasse 12, 1030 Vienna',
        phone: '+43 1 716 130', email: 'ukinaustria@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      switzerland: {
        country: 'Switzerland', flag: '🇨🇭', continent: 'Europe',
        name: 'British Embassy Bern',
        address: 'Thunstrasse 50, 3005 Bern',
        phone: '+41 31 359 7700', email: 'consular.bern@fco.gov.uk',
        hours: 'Mon–Fri 09:00–12:30'
      },
      sweden: {
        country: 'Sweden', flag: '🇸🇪', continent: 'Europe',
        name: 'British Embassy Stockholm',
        address: 'Skarpögatan 6-8, 115 27 Stockholm',
        phone: '+46 8 671 3000', email: 'consular.stockholm@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:30'
      },
      norway: {
        country: 'Norway', flag: '🇳🇴', continent: 'Europe',
        name: 'British Embassy Oslo',
        address: 'Thomas Heftyes gate 8, 0244 Oslo',
        phone: '+47 23 13 27 00', email: 'consular.oslo@fco.gov.uk',
        hours: 'Mon–Fri 09:00–15:30'
      },
      denmark: {
        country: 'Denmark', flag: '🇩🇰', continent: 'Europe',
        name: 'British Embassy Copenhagen',
        address: 'Kastelsvej 36-40, 2100 Copenhagen',
        phone: '+45 35 44 52 00', email: 'consular.copenhagen@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:00'
      },
      finland: {
        country: 'Finland', flag: '🇫🇮', continent: 'Europe',
        name: 'British Embassy Helsinki',
        address: 'Itäinen Puistotie 17, 00140 Helsinki',
        phone: '+358 9 2286 5100', email: 'consular.helsinki@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:00'
      },
      iceland: {
        country: 'Iceland', flag: '🇮🇸', continent: 'Europe',
        name: 'British Embassy Reykjavik',
        address: 'Engjateigur 7, 105 Reykjavik',
        phone: '+354 550 5100', email: 'BritishEmbassyReykjavik@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      ireland: {
        country: 'Ireland', flag: '🇮🇪', continent: 'Europe',
        name: 'British Embassy Dublin',
        address: '29 Merrion Road, Ballsbridge, Dublin 4',
        phone: '+353 1 205 3700', email: 'consular.dublin@fco.gov.uk',
        hours: 'Mon–Fri 09:30–16:30'
      },
      czech_republic: {
        country: 'Czech Republic', flag: '🇨🇿', continent: 'Europe',
        name: 'British Embassy Prague',
        address: 'Thunovská 14, 118 00 Prague 1',
        phone: '+420 257 402 111', email: 'consular.prague@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      poland: {
        country: 'Poland', flag: '🇵🇱', continent: 'Europe',
        name: 'British Embassy Warsaw',
        address: 'Aleje Róż 1, 00-556 Warsaw',
        phone: '+48 22 311 0000', email: 'consular.warsaw@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:30'
      },
      hungary: {
        country: 'Hungary', flag: '🇭🇺', continent: 'Europe',
        name: 'British Embassy Budapest',
        address: 'Füge utca 5-7, 1024 Budapest',
        phone: '+36 1 266 2888', email: 'consular.budapest@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:30'
      },
      romania: {
        country: 'Romania', flag: '🇷🇴', continent: 'Europe',
        name: 'British Embassy Bucharest',
        address: '24 Jules Michelet Street, 010463 Bucharest',
        phone: '+40 21 201 7200', email: 'consular.bucharest@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      croatia: {
        country: 'Croatia', flag: '🇭🇷', continent: 'Europe',
        name: 'British Embassy Zagreb',
        address: 'Ivana Lučića 4, 10000 Zagreb',
        phone: '+385 1 600 9100', email: 'consular.zagreb@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      turkey: {
        country: 'Turkey', flag: '🇹🇷', continent: 'Europe/Asia',
        name: 'British Embassy Ankara',
        address: 'Şehit Ersan Caddesi 46/A, 06680 Çankaya, Ankara',
        phone: '+90 312 455 3344', email: 'consular.ankara@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:30'
      },
      usa: {
        country: 'USA', flag: '🇺🇸', continent: 'Americas',
        name: 'British Embassy Washington DC',
        address: '3100 Massachusetts Ave NW, Washington DC 20008',
        phone: '+1 202 588 6500', email: 'consular.washington@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      canada: {
        country: 'Canada', flag: '🇨🇦', continent: 'Americas',
        name: 'British High Commission Ottawa',
        address: '80 Elgin Street, Ottawa, Ontario K1P 5K7',
        phone: '+1 613 237 1530', email: 'consular.ottawa@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:30'
      },
      mexico: {
        country: 'Mexico', flag: '🇲🇽', continent: 'Americas',
        name: 'British Embassy Mexico City',
        address: 'Río Santa Fe 505, Cuajimalpa de Morelos, 05349 Mexico City',
        phone: '+52 55 1670 3200', email: 'consular.mexico@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      brazil: {
        country: 'Brazil', flag: '🇧🇷', continent: 'Americas',
        name: 'British Embassy Brasilia',
        address: 'Setor de Embaixadas Sul, Quadra 801, Conjunto K, 70408-900 Brasilia',
        phone: '+55 61 3329 2300', email: 'consular.brasilia@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      argentina: {
        country: 'Argentina', flag: '🇦🇷', continent: 'Americas',
        name: 'British Embassy Buenos Aires',
        address: 'Dr Luis Agote 2412, Buenos Aires C1425EOF',
        phone: '+54 11 4808 2200', email: 'consular.buenosaires@fco.gov.uk',
        hours: 'Mon–Fri 09:00–13:00'
      },
      peru: {
        country: 'Peru', flag: '🇵🇪', continent: 'Americas',
        name: 'British Embassy Lima',
        address: 'Torre Parque Mar, Piso 22, Av. José Larco 1301, Miraflores, Lima',
        phone: '+51 1 617 3000', email: 'consular.lima@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      colombia: {
        country: 'Colombia', flag: '🇨🇴', continent: 'Americas',
        name: 'British Embassy Bogota',
        address: 'Carrera 9 No 76-49, Piso 9, Bogota',
        phone: '+57 1 326 8300', email: 'consular.bogota@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:30'
      },
      costa_rica: {
        country: 'Costa Rica', flag: '🇨🇷', continent: 'Americas',
        name: 'British Embassy San José',
        address: 'Edificio Centro Colon, Paseo Colon, San José',
        phone: '+506 2258 2025', email: 'consular.sanjose@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:00'
      },
      japan: {
        country: 'Japan', flag: '🇯🇵', continent: 'Asia-Pacific',
        name: 'British Embassy Tokyo',
        address: '1 Ichiban-cho, Chiyoda-ku, Tokyo 102-8381',
        phone: '+81 3 5211 1100', email: 'consular.tokyo@fco.gov.uk',
        hours: 'Mon–Fri 09:00–12:00, 14:00–16:00'
      },
      thailand: {
        country: 'Thailand', flag: '🇹🇭', continent: 'Asia-Pacific',
        name: 'British Embassy Bangkok',
        address: '14 Wireless Road, Lumphini, Pathumwan, Bangkok 10330',
        phone: '+66 2 305 8333', email: 'consular.bangkok@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:00'
      },
      indonesia: {
        country: 'Indonesia', flag: '🇮🇩', continent: 'Asia-Pacific',
        name: 'British Embassy Jakarta',
        address: 'Jl. Patra Kuningan Raya Blok L5-6, Jakarta 12950',
        phone: '+62 21 2356 5200', email: 'consular.jakarta@fco.gov.uk',
        hours: 'Mon–Thu 07:30–16:00, Fri 07:30–13:00'
      },
      vietnam: {
        country: 'Vietnam', flag: '🇻🇳', continent: 'Asia-Pacific',
        name: 'British Embassy Hanoi',
        address: 'Central Building, 31 Hai Ba Trung, Hoan Kiem, Hanoi',
        phone: '+84 24 3936 0500', email: 'consular.hanoi@fco.gov.uk',
        hours: 'Mon–Fri 08:00–17:00'
      },
      malaysia: {
        country: 'Malaysia', flag: '🇲🇾', continent: 'Asia-Pacific',
        name: 'British High Commission Kuala Lumpur',
        address: '185 Jalan Ampang, 50450 Kuala Lumpur',
        phone: '+60 3 2170 2200', email: 'consular.kl@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:30'
      },
      singapore: {
        country: 'Singapore', flag: '🇸🇬', continent: 'Asia-Pacific',
        name: 'British High Commission Singapore',
        address: '100 Tanglin Road, Singapore 247919',
        phone: '+65 6424 4200', email: 'consular.singapore@fco.gov.uk',
        hours: 'Mon–Fri 08:30–17:00'
      },
      india: {
        country: 'India', flag: '🇮🇳', continent: 'Asia-Pacific',
        name: 'British High Commission New Delhi',
        address: 'Shantipath, Chanakyapuri, New Delhi 110021',
        phone: '+91 11 2419 2100', email: 'consular.delhi@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      sri_lanka: {
        country: 'Sri Lanka', flag: '🇱🇰', continent: 'Asia-Pacific',
        name: 'British High Commission Colombo',
        address: '389 Bauddhaloka Mawatha, Colombo 7',
        phone: '+94 11 539 0639', email: 'consular.colombo@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:30'
      },
      maldives: {
        country: 'Maldives', flag: '🇲🇻', continent: 'Asia-Pacific',
        name: 'British High Commission (based in Colombo)',
        address: '389 Bauddhaloka Mawatha, Colombo 7, Sri Lanka',
        phone: '+94 11 539 0639', email: 'consular.colombo@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:30'
      },
      uae: {
        country: 'UAE', flag: '🇦🇪', continent: 'Middle East',
        name: 'British Embassy Abu Dhabi',
        address: 'PO Box 248, Abu Dhabi',
        phone: '+971 2 610 1100', email: 'consular.abudhabi@fco.gov.uk',
        hours: 'Mon–Thu 07:30–15:30, Fri 07:30–13:00'
      },
      australia: {
        country: 'Australia', flag: '🇦🇺', continent: 'Asia-Pacific',
        name: 'British High Commission Canberra',
        address: 'Commonwealth Avenue, Yarralumla ACT 2600',
        phone: '+61 2 6270 6666', email: 'consular.canberra@fco.gov.uk',
        hours: 'Mon–Fri 09:00–17:00'
      },
      new_zealand: {
        country: 'New Zealand', flag: '🇳🇿', continent: 'Asia-Pacific',
        name: 'British High Commission Wellington',
        address: '44 Hill Street, Thorndon, Wellington 6011',
        phone: '+64 4 924 2888', email: 'consular.wellington@fco.gov.uk',
        hours: 'Mon–Fri 09:00–16:30'
      },
      south_africa: {
        country: 'South Africa', flag: '🇿🇦', continent: 'Africa',
        name: 'British High Commission Pretoria',
        address: '255 Hill Street, Arcadia, 0002 Pretoria',
        phone: '+27 12 421 7500', email: 'consular.pretoria@fco.gov.uk',
        hours: 'Mon–Fri 08:00–16:00'
      },
      kenya: {
        country: 'Kenya', flag: '🇰🇪', continent: 'Africa',
        name: 'British High Commission Nairobi',
        address: 'Upper Hill Road, Nairobi',
        phone: '+254 20 284 4000', email: 'consular.nairobi@fco.gov.uk',
        hours: 'Mon–Thu 08:00–16:30, Fri 08:00–13:00'
      },
      tanzania: {
        country: 'Tanzania', flag: '🇹🇿', continent: 'Africa',
        name: 'British High Commission Dar es Salaam',
        address: 'Umoja House, Hamburg Avenue, Dar es Salaam',
        phone: '+255 22 229 0000', email: 'consular.daressalaam@fco.gov.uk',
        hours: 'Mon–Thu 08:00–16:00, Fri 08:00–13:00'
      },
      morocco: {
        country: 'Morocco', flag: '🇲🇦', continent: 'Africa',
        name: 'British Embassy Rabat',
        address: '28 Avenue SAR Sidi Mohammed, Souissi, Rabat',
        phone: '+212 537 633 333', email: 'consular.rabat@fco.gov.uk',
        hours: 'Mon–Thu 08:00–16:30, Fri 08:00–12:30'
      },
      egypt: {
        country: 'Egypt', flag: '🇪🇬', continent: 'Africa/Middle East',
        name: 'British Embassy Cairo',
        address: '7 Ahmed Ragheb Street, Garden City, Cairo',
        phone: '+20 2 2791 6000', email: 'consular.cairo@fco.gov.uk',
        hours: 'Mon–Thu 08:00–15:30, Sun 08:00–15:30'
      },
      ghana: {
        country: 'Ghana', flag: '🇬🇭', continent: 'Africa',
        name: 'British High Commission Accra',
        address: '45 Ambassadorial Enclave, East Cantonments, Accra',
        phone: '+233 30 213 0521', email: 'consular.accra@fco.gov.uk',
        hours: 'Mon–Thu 08:00–16:30, Fri 08:00–13:00'
      },
      jordan: {
        country: 'Jordan', flag: '🇯🇴', continent: 'Middle East',
        name: 'British Embassy Amman',
        address: 'Abdoun, PO Box 87, Amman 11118',
        phone: '+962 6 590 9200', email: 'consular.amman@fco.gov.uk',
        hours: 'Mon–Thu 08:00–16:00, Fri 08:00–13:00'
      },
      israel: {
        country: 'Israel', flag: '🇮🇱', continent: 'Middle East',
        name: 'British Embassy Tel Aviv',
        address: '192 Hayarkon Street, Tel Aviv 63405',
        phone: '+972 3 725 1222', email: 'consular.telaviv@fco.gov.uk',
        hours: 'Mon–Thu 08:30–13:30'
      }
    },

    /* ── Risk & Advisory Data ─────────────────────────────────────── */
    advisories: {
      france: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Low overall crime in most areas. Remain vigilant in crowded tourist spots, particularly around the Eiffel Tower, Louvre, and on the Paris Métro. Terrorism risk exists; follow local advice.',
        health: 'No specific health risks for most travellers. European Health Insurance Card (EHIC/GHIC) provides emergency cover. Tap water safe to drink.',
        entry: 'UK citizens can visit visa-free for up to 90 days in any 180-day period. Valid passport required — check at least 6 months validity.',
        laws: 'Drugs are strictly illegal. Photographing police or military is restricted. Always carry ID. Demonstrations can occur with little notice.'
      },
      spain: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Petty theft common in tourist areas, especially Barcelona\'s La Rambla. Remain vigilant at transport hubs and beaches. Scooter theft from handbags reported.',
        health: 'No specific health risks. EHIC/GHIC valid. Strong healthcare system. Sun protection essential in summer.',
        entry: 'Visa-free for up to 90 days. Passport required with 6 months validity beyond travel dates.',
        laws: 'Alcohol consumption on the street is restricted in many cities. Nudism only permitted in designated areas. Drones restricted near airports and cities.'
      },
      italy: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Pickpocketing in Rome, Florence, and Venice. Scams near major tourist attractions. Transport strikes can occur. Natural disaster risk in some regions.',
        health: 'Good healthcare system. EHIC/GHIC valid. Air quality can be poor in cities. Heatwaves increasingly common in summer.',
        entry: 'Visa-free for up to 90 days. Passport required. Italy is a Schengen state.',
        laws: 'Entering churches with bare shoulders is prohibited. Feeding pigeons in some squares is illegal. Carrying alcohol in bottles near stadiums is banned.'
      },
      portugal: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'One of the safest countries in Europe. Petty theft can occur in Lisbon\'s Alfama district and on public transport. Wildfire risk in summer months.',
        health: 'Excellent healthcare. EHIC/GHIC valid. Wildfire smoke risk in summer. Water safe to drink.',
        entry: 'Visa-free for up to 90 days. Passport required.',
        laws: 'Personal drug use is decriminalised but supply is illegal. Drinking in public is legal in most areas.'
      },
      greece: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Generally safe. Pickpocketing in Athens and tourist areas. Protests and strikes can affect transport. Wildfire and earthquake risk.',
        health: 'EHIC/GHIC valid. Heat-related illness risk in summer. Mosquito repellent recommended for evenings.',
        entry: 'Visa-free for 90 days. Passport required with 6 months validity.',
        laws: 'Photographing military installations illegal. Nudism only in designated areas. Smoking banned in indoor public spaces.'
      },
      germany: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Very safe. Low petty crime. Terrorism risk in line with Western Europe. Protests occasionally affect city centres.',
        health: 'Excellent healthcare. EHIC/GHIC valid. Air quality good. Tick-borne encephalitis risk in forested areas.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Jaywalking can result in fines. Speed limits strictly enforced except on autobahn sections. Strict recycling laws.'
      },
      netherlands: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Safe country. Bike theft common in Amsterdam. Pickpocketing in tourist areas. Red Light District requires vigilance at night.',
        health: 'Excellent healthcare. EHIC/GHIC valid. No specific health risks.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Cannabis is tolerated in licensed coffeeshops only — not fully legal. Hard drugs carry severe penalties. Cycling while intoxicated is illegal.'
      },
      belgium: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Terrorism risk exists (Brussels is a target due to EU institutions). Petty crime in Brussels city centre. Generally safe for tourists.',
        health: 'EHIC/GHIC valid. No specific health risks.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Carrying ID is mandatory. Public intoxication can lead to arrest. Knife possession in public is restricted.'
      },
      austria: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Very safe. Low crime rates. Terrorism alert level is elevated in Vienna. Alpine activities carry natural hazards.',
        health: 'Excellent healthcare. EHIC/GHIC valid. Tick-borne encephalitis in forests — vaccination recommended if hiking.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Face coverings banned in public spaces. Strict noise regulations in residential areas at night.'
      },
      switzerland: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'One of the world\'s safest countries. Very low crime. Mountain rescue services excellent. Altitude sickness risk in high alpine areas.',
        health: 'World-class healthcare but very expensive — travel insurance essential. No EHIC/GHIC applicable.',
        entry: 'Visa-free for 90 days but Switzerland is not an EU/EEA state. Passport required.',
        laws: 'Strict noise laws — avoid loud noise after 10pm. Littering fined heavily. Fireworks restricted.'
      },
      sweden: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'One of the safest countries. Low petty crime. Gang-related violence in suburban areas does not typically affect tourists.',
        health: 'Excellent healthcare. EHIC/GHIC valid. Tick-borne encephalitis risk in forests in spring/summer.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Drink-driving laws very strict. Drugs carry significant penalties. Freedom to roam (Allemansrätten) allows access to nature.'
      },
      norway: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'Extremely safe. Petty crime very low. Natural hazards including avalanches, fjord weather, and extreme cold in winter.',
        health: 'World-class healthcare. EHIC/GHIC valid. Emergency care is free.',
        entry: 'Visa-free for 90 days (Schengen). Passport required.',
        laws: 'Strict drink-driving laws. Outdoor fires prohibited May–September in forests. Speed cameras widespread.'
      },
      denmark: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'Very safe. Bicycle theft common in Copenhagen. Occasional gang violence in specific areas does not affect tourists.',
        health: 'Excellent healthcare. EHIC/GHIC valid.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Cycling drunk is illegal. Littering fined. Public sex is illegal.'
      },
      finland: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'One of the world\'s safest countries. Extreme cold and blizzard risk in winter. Wildlife hazards (moose on roads) in rural areas.',
        health: 'EHIC/GHIC valid. No specific health risks.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Alcohol only sold in licensed establishments and Alko stores. Strict drink-driving laws.'
      },
      iceland: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'Among the safest countries on Earth. Natural hazards significant: volcanic activity, geysers, sudden weather changes, and dangerous glacial rivers.',
        health: 'Excellent healthcare. EHIC/GHIC valid. UV radiation can be intense.',
        entry: 'Visa-free for 90 days (Schengen). Passport required.',
        laws: 'Driving off-road is illegal and fined heavily. Approach geysers with caution — scalding injuries occur.'
      },
      ireland: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Safe country. Petty crime in Dublin city centre. Rural roads can be narrow and challenging.',
        health: 'Excellent healthcare. Reciprocal healthcare agreement with UK. No specific health risks.',
        entry: 'No passport required for UK citizens — Common Travel Area applies. Photo ID recommended.',
        laws: 'Drink-driving laws strict. Noise nuisance can result in fines. Drug possession is an offence.'
      },
      czech_republic: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Prague is generally safe. Taxi and bar scams targeting tourists in city centre. Pickpocketing on Charles Bridge and trams.',
        health: 'EHIC/GHIC valid. Good healthcare. Tick-borne encephalitis in forests.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Drinking alcohol in public is legal in most areas. Zero tolerance for drink-driving. Jaywalking fined.'
      },
      poland: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Generally safe. Petty crime in Warsaw and Krakow tourist areas. Anti-LGBT+ sentiment in some regions.',
        health: 'EHIC/GHIC valid. Good healthcare. Air quality can be poor in winter (smog).',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Alcohol banned in public in many cities. Strict drug laws. Photography of military sites restricted.'
      },
      hungary: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Generally safe. Scams targeting tourists in Budapest (taxi, exchange). Ruin bar areas can be rowdy at night.',
        health: 'EHIC/GHIC valid. Healthcare varies by facility. Pharmacies widespread.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Strict drug laws including cannabis. Public display of affection by same-sex couples may draw attention. Strict noise rules at night.'
      },
      romania: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Petty crime in Bucharest. Unlicensed taxis a known scam. Stray dogs still an issue in some areas. Road safety concerns — accident rates high.',
        health: 'EHIC/GHIC valid but healthcare quality varies. Rabies risk from stray dogs — avoid contact. Tick-borne encephalitis in forests.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Bribery strictly illegal — report if solicited. Off-road driving in some national park areas prohibited.'
      },
      croatia: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Safe tourist destination. Petty crime in Dubrovnik and Split. Sea urchins a hazard when swimming. Unexploded ordnance risk in remote rural areas.',
        health: 'EHIC/GHIC valid. Good healthcare in cities. Sun protection essential. Jellyfish seasonal.',
        entry: 'Visa-free for 90 days (EU member since 2023). Passport required.',
        laws: 'Nudism only in designated FKK areas. Littering fined heavily. Noise ordinances strictly enforced in historic towns.'
      },
      turkey: {
        riskLevel: 5, riskLabel: 'Moderate',
        safety: 'Terrorism risk across the country, particularly in border regions and crowded public spaces. Political unrest possible. Large earthquakes have affected the east. Crime rates elevated in tourist areas.',
        health: 'No specific vaccine requirements. Healthcare good in major cities. Tap water best avoided.',
        entry: 'UK citizens need a valid passport — no visa required for stays up to 90 days. Check current entry requirements before travel.',
        laws: 'Insulting the Turkish state or president is a criminal offence. LGBT+ gatherings restricted. Photography of military sites strictly prohibited.'
      },
      usa: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Gun violence risk higher than most Western countries. Crime rates vary significantly by city and neighbourhood. Natural disasters (hurricanes, tornadoes, wildfires) in specific regions. Always follow local authority advice.',
        health: 'Excellent healthcare but extremely expensive — comprehensive travel insurance essential. No reciprocal healthcare with UK.',
        entry: 'ESTA required for visa-free travel (up to 90 days). Apply at least 72 hours before departure. Valid passport with RFID chip required.',
        laws: 'Laws vary significantly by state — particularly regarding firearms, cannabis, and age of consent. Always carry ID. Jaywalking is an offence in many states.'
      },
      canada: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Very safe overall. Urban areas have pockets of higher crime. Wildlife hazards in national parks (bears, cougars). Extreme weather in winter.',
        health: 'Excellent healthcare but expensive — travel insurance essential. No reciprocal arrangement with UK.',
        entry: 'eTA required for visa-free air travel. Apply before departure. Stays up to 6 months permitted.',
        laws: 'Cannabis legal in Canada but restrictions on use in public vary by province. DUI laws strict. Firearms laws complex.'
      },
      mexico: {
        riskLevel: 6, riskLabel: 'High Risk',
        safety: 'High crime, kidnapping, and cartel-related violence in many regions. FCO advises against all travel to certain border states. Tourist areas (Cancún, Los Cabos) generally safer but not immune. Express kidnappings reported.',
        health: 'Travel insurance essential. Hepatitis A and Typhoid vaccination recommended. Tap water unsafe — drink bottled only. Zika virus risk.',
        entry: 'Visa-free for up to 180 days. Valid passport required. Tourist card (FMM) issued on arrival.',
        laws: 'Drug laws extremely strict — possession can result in imprisonment. Carrying firearms into Mexico is illegal. Bribing officials is illegal.'
      },
      brazil: {
        riskLevel: 6, riskLabel: 'High Risk',
        safety: 'Very high crime rate in major cities. Robbery, carjacking, and express kidnapping occur. Favelas are dangerous for tourists. Natural hazards include flooding in wet season. Protests can become violent.',
        health: 'Yellow Fever vaccination required from certain countries; recommended for Amazon region. Hepatitis A, Typhoid. Dengue, Zika, and Chikungunya risk. Malaria in Amazon basin.',
        entry: 'Visa-free for UK citizens for up to 90 days. Passport required.',
        laws: 'Drug trafficking carries very severe penalties. LGBTQ+ rights are constitutionally protected. Carnival behaviour codes in place during festival.'
      },
      argentina: {
        riskLevel: 4, riskLabel: 'Moderate',
        safety: 'Petty crime and pickpocketing in Buenos Aires. Economic instability has increased crime rates. Protest activity can affect travel. River and flash flood risks in some regions.',
        health: 'No specific vaccine requirements for most travellers. Yellow Fever recommended for northern regions. Dengue risk. Healthcare varies by region.',
        entry: 'Visa-free for up to 90 days. Passport required.',
        laws: 'Cannabis possession decriminalised in small amounts. Strict customs on importing agricultural goods. Street money changers (blue rate) are illegal.'
      },
      peru: {
        riskLevel: 5, riskLabel: 'Moderate',
        safety: 'Petty crime and robbery in Lima and Cusco. Express kidnappings reported. Altitude sickness (soroche) is a genuine risk above 3,500m. Political protests can turn violent and block transport routes.',
        health: 'Hepatitis A, Typhoid, Tetanus recommended. Yellow Fever for Amazon regions. Malaria risk in jungle areas. Altitude sickness prevention medication available.',
        entry: 'Visa-free for up to 183 days. Passport required.',
        laws: 'Drug possession, including coca leaves, is technically illegal but enforcement varies. Ancient site access regulated — use licensed guides at Machu Picchu.'
      },
      colombia: {
        riskLevel: 5, riskLabel: 'Moderate',
        safety: 'Security has improved greatly but armed groups, kidnapping, and drug-related violence remain risks in rural areas. Cities are generally safer but pickpocketing and scopolamine (burundanga) drugging are serious concerns.',
        health: 'Hepatitis A, Typhoid recommended. Yellow Fever for some regions. Dengue and Zika risk. Malaria in rural lowlands.',
        entry: 'Visa-free for 90 days. Passport required.',
        laws: 'Drug possession carries severe penalties despite Colombia\'s association with narcotics. Do not accept drinks from strangers.'
      },
      costa_rica: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Relatively safe in tourist areas. Petty crime in San José and beach areas. Wildlife and jungle hazards. Road conditions can be poor in rural areas.',
        health: 'Hepatitis A, Typhoid recommended. Dengue risk. No malaria in most tourist areas. Tap water generally safe in cities.',
        entry: 'Visa-free for 90 days. Passport required with 6 months validity.',
        laws: 'Drugs carry severe penalties. Wildlife protection laws strictly enforced — do not buy wildlife products. Prostitution is legal but regulated.'
      },
      japan: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'One of the world\'s safest countries. Extremely low crime. Natural disaster risk: earthquakes, tsunamis, typhoons, and volcanic activity. Follow all disaster preparedness advice.',
        health: 'Excellent healthcare. Travel insurance recommended for cost. No specific vaccine requirements. Japanese encephalitis vaccination for rural long stays.',
        entry: 'Visa-free for up to 90 days. Passport required with 6 months validity.',
        laws: 'Zero tolerance for drugs — even small amounts can result in lengthy imprisonment. Carrying prescription medication requires documentation. Tattoos restricted at many onsen (hot springs).'
      },
      thailand: {
        riskLevel: 4, riskLabel: 'Moderate',
        safety: 'Generally safe in tourist areas but risks include: road accidents (high mortality), scams targeting tourists, political unrest, and petty crime. Beaches have dangerous riptides. Methanol poisoning incidents from counterfeit spirits.',
        health: 'Hepatitis A, Typhoid recommended. Rabies risk — avoid contact with animals. Malaria in border regions. Dengue common in rainy season. Tap water unsafe — bottled only.',
        entry: 'Visa-free for 60 days (extendable to 90 days). Passport required.',
        laws: 'Insulting the monarchy (lèse-majesté) carries a 15-year prison sentence. Drug possession can result in death penalty. Vaping and e-cigarettes are illegal. Three-finger protest gesture is politically sensitive.'
      },
      indonesia: {
        riskLevel: 4, riskLabel: 'Moderate',
        safety: 'Terrorism risk (past attacks in Bali and Jakarta). Natural disasters: earthquakes, volcanoes, and tsunamis are genuine risks. Road safety poor. Riptides at Bali beaches kill every year.',
        health: 'Hepatitis A, Typhoid, Rabies (Bali) recommended. Malaria in rural areas. Dengue common. Japanese encephalitis for rural stays. Tap water unsafe.',
        entry: 'Visa on arrival available for 30 days (extendable). Passport required with 6 months validity.',
        laws: 'Drug offences carry the death penalty. Pre-marital sex is illegal in some provinces. Photographing police or military without permission is restricted. Pornography is banned.'
      },
      vietnam: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Relatively safe but bag snatching by motorbike is a significant risk. Traffic accidents are a leading cause of tourist deaths. Scams in tourist areas. Border regions with China require extra caution.',
        health: 'Hepatitis A, Typhoid recommended. Rabies risk from dogs and bats. Malaria in some rural areas. Dengue common. Japanese encephalitis for rural stays.',
        entry: 'UK citizens can visit visa-free for 45 days. Longer stays require e-visa. Passport required.',
        laws: 'Photography of military/government buildings illegal. Drug offences very severe. Political discussion and criticism of the government should be avoided.'
      },
      malaysia: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Generally safe. Petty crime in KL. Terrorism risk in Sabah (eastern Borneo). Road safety concerns. Monsoon season flooding.',
        health: 'Hepatitis A, Typhoid recommended. Dengue common. Malaria in Sabah and rural Sarawak. Japanese encephalitis for rural areas.',
        entry: 'Visa-free for 90 days. Passport required with 6 months validity.',
        laws: 'Sharia law applies to Muslims. Same-sex relations are illegal. Drug trafficking is a capital offence. Public displays of affection restricted.'
      },
      singapore: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'Exceptionally safe. One of the lowest crime rates in the world. Heat-related illness risk. Occasional haze from Indonesian forest fires.',
        health: 'Excellent healthcare. Dengue present — mosquito protection recommended. No specific vaccine requirements.',
        entry: 'Visa-free for 30 days (extendable). Passport required with 6 months validity.',
        laws: 'Chewing gum banned. Littering fined heavily. Drug trafficking carries the death penalty. Jaywalking fined. Vaping is illegal.'
      },
      india: {
        riskLevel: 5, riskLabel: 'Moderate',
        safety: 'Terrorism risk, particularly in Jammu & Kashmir and some northeastern states. Women travellers face significant risk of sexual harassment and assault. Road safety extremely poor. Air quality severe in northern cities. Natural disasters: monsoon flooding, heatwaves.',
        health: 'Hepatitis A, Typhoid, Tetanus essential. Malaria prophylaxis for most regions. Rabies risk — seek immediate treatment for any animal bite. Cholera possible. Tap water unsafe — bottled only.',
        entry: 'E-visa required — apply at least 4 days before travel. Passport required with 6 months validity.',
        laws: 'Photography near military sites, border areas, and airports restricted. Homosexuality was recently partially legalised but discrimination remains. Beef consumption/handling restricted in many states.'
      },
      sri_lanka: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Recovering from economic crisis and civil unrest (2022). Generally safe for tourists now. Petty crime exists. Rip tides on beaches. Risk of dengue. Protests can occur.',
        health: 'Hepatitis A, Typhoid recommended. Dengue risk. Malaria in some northern areas. Rabies risk. Tap water unsafe.',
        entry: 'ETA (Electronic Travel Authorisation) required — apply online before arrival. Passport required.',
        laws: 'Same-sex relations are illegal. Drug offences severe. Photography of religious sites requires modest dress. Drone use requires permits.'
      },
      maldives: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Safe at resort islands. Political tensions in Malé can lead to unrest. Ocean hazards: currents, sharks (rare), and marine life. Medical evacuation is expensive.',
        health: 'No specific vaccine requirements but Hepatitis A recommended. Comprehensive travel insurance with medical evacuation essential — healthcare limited outside Malé. Tap water unsafe.',
        entry: 'Visa on arrival for 30 days. Passport required with 6 months validity. Return ticket required.',
        laws: 'Islamic law applies — alcohol only permitted in resort islands. Pork products banned. Pornography banned. Public display of affection restricted. Dress conservatively outside resorts.'
      },
      uae: {
        riskLevel: 2, riskLabel: 'Low Risk',
        safety: 'Very safe country with low crime. However, laws are strict and culturally conservative. Road traffic accidents are common — drive carefully. Extreme heat (45°C+) in summer is a genuine health risk.',
        health: 'Excellent healthcare in Dubai and Abu Dhabi. No specific vaccine requirements. Heat exhaustion and dehydration risk in summer.',
        entry: 'Visa on arrival for 30 days (extendable). Passport required with 6 months validity.',
        laws: 'Alcohol only permitted in licensed venues. Public displays of affection illegal. Same-sex relations are criminal. Drug possession carries severe penalties. Blasphemy and swearing in public are criminal offences. Dress conservatively in public areas.'
      },
      australia: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'Very safe. Wildlife hazards are real: sharks, crocodiles, jellyfish, snakes, and spiders. Bush fires in summer. UV radiation is extreme — sun protection essential.',
        health: 'Excellent healthcare. Comprehensive travel insurance recommended (healthcare expensive for non-residents). No specific vaccine requirements.',
        entry: 'ETA or eVisitor visa required before travel. Passport required.',
        laws: 'Strict biosecurity — declare all food, plant material, and animal products. Drug laws strict and vary by state. Speed cameras widespread.'
      },
      new_zealand: {
        riskLevel: 1, riskLabel: 'Very Safe',
        safety: 'Very safe. Earthquake and volcanic risk (particularly North Island). Rip tides at beaches. Hypothermia risk in alpine areas.',
        health: 'Excellent healthcare. Travel insurance strongly recommended. No specific vaccine requirements.',
        entry: 'NZeTA required for visa-free travel. Passport required.',
        laws: 'Strict biosecurity — declare all food and biological products. Cannabis possession recently decriminalised in small amounts. Drink-driving laws strict.'
      },
      south_africa: {
        riskLevel: 6, riskLabel: 'High Risk',
        safety: 'Very high crime rate — one of the highest in the world. Armed robbery, carjacking, and mugging are common in cities. Township visits should be with reputable guides only. Power cuts (load-shedding) affect security infrastructure.',
        health: 'Malaria prophylaxis essential for game reserve areas. Hepatitis A, Typhoid recommended. HIV prevalence high — take precautions. Good private healthcare in major cities.',
        entry: 'Visa-free for 90 days. Passport required with 30 days validity beyond travel dates.',
        laws: 'Same-sex relations legal and constitutionally protected. Drug laws strict. Wildlife trade laws severe. Do not carry weapons — even defensive sprays require permits.'
      },
      kenya: {
        riskLevel: 5, riskLabel: 'Moderate',
        safety: 'Terrorism risk from Al-Shabaab, particularly in border areas with Somalia and in Nairobi. Kidnapping risk in border regions. Petty crime and mugging in Nairobi. Road safety extremely poor.',
        health: 'Yellow Fever vaccination required if coming from infected country. Malaria prophylaxis essential. Hepatitis A, Typhoid. Rabies risk. Water safety: bottled only.',
        entry: 'E-visa required — apply before travel. Passport required with 6 months validity.',
        laws: 'Same-sex relations are illegal. Photography of government buildings, airports, and bridges restricted. Possession of plastic bags is illegal.'
      },
      tanzania: {
        riskLevel: 4, riskLabel: 'Moderate',
        safety: 'Petty crime and bag snatching in Dar es Salaam and tourist areas. Road safety poor. Occasional political violence. Altitude sickness risk on Kilimanjaro (5,895m).',
        health: 'Yellow Fever vaccination required. Malaria prophylaxis essential throughout. Hepatitis A, Typhoid. Rabies risk. Schistosomiasis (bilharzia) risk in freshwater lakes.',
        entry: 'Visa required — apply e-visa before travel. Passport required with 6 months validity.',
        laws: 'Same-sex relations are illegal with severe penalties. Photography of government buildings restricted. Tanzanite purchasing restricted — buy only from licensed dealers.'
      },
      morocco: {
        riskLevel: 4, riskLabel: 'Moderate',
        safety: 'Terrorism risk (elevated post-2023 earthquake). Harassment of women travellers in medinas. Fake guides and aggressive vendors in souks. Pickpocketing in busy areas. Desert areas require guided navigation.',
        health: 'Hepatitis A, Typhoid recommended. Tap water unsafe — bottled only. Rabies risk in rural areas. Sun and heat protection essential.',
        entry: 'Visa-free for 90 days. Passport required with 6 months validity.',
        laws: 'Same-sex relations are illegal. Marijuana is widely available but illegal — possession can lead to imprisonment. Public displays of affection restricted. Ramadan behaviour restrictions apply in public.'
      },
      egypt: {
        riskLevel: 5, riskLabel: 'Moderate',
        safety: 'Terrorism risk throughout, particularly in North Sinai (avoid all travel). Sexual harassment of women is very common in public spaces. Road safety extremely poor. Scams targeting tourists in tourist areas.',
        health: 'Hepatitis A, Typhoid recommended. Tap water unsafe. Rabies risk. Sun and heat protection critical. Gastrointestinal illness common from food.',
        entry: 'Visa on arrival or e-visa required. Passport required with 6 months validity.',
        laws: 'Photography of military, bridges, and government buildings is strictly illegal. Same-sex relations are effectively illegal under public morality laws. Drug laws extremely severe.'
      },
      ghana: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Relatively stable and safe by West African standards. Petty crime in Accra. Armed robbery can occur. Road safety poor. Flooding in rainy season.',
        health: 'Yellow Fever vaccination required. Malaria prophylaxis essential. Hepatitis A, Typhoid. Rabies risk. Tap water unsafe.',
        entry: 'Visa required — apply before travel. Passport required with 6 months validity.',
        laws: 'Same-sex relations are illegal. Drug possession carries severe penalties. Photography of government buildings restricted.'
      },
      jordan: {
        riskLevel: 3, riskLabel: 'Moderate',
        safety: 'Relatively safe by regional standards. Terrorism risk given regional conflicts. Petty crime low but exists. Travel near Syrian and Iraqi borders strongly discouraged.',
        health: 'Hepatitis A, Typhoid recommended. Tap water avoid in rural areas. Heat protection essential.',
        entry: 'Visa on arrival for most travellers. Jordan Pass covers entry fee and popular attractions. Passport required.',
        laws: 'Public displays of affection restricted. Drug possession illegal. Photographing military and government sites prohibited. Alcohol available in licensed establishments.'
      },
      israel: {
        riskLevel: 6, riskLabel: 'High Risk',
        safety: 'Active conflict in Gaza; FCO advises against travel to certain areas. Terrorist attacks have occurred in Tel Aviv and Jerusalem. Rocket fire risk near Gaza border. Security situation can change rapidly.',
        health: 'Excellent healthcare. No specific vaccine requirements. Travel insurance essential for medical evacuation.',
        entry: 'Passport required — Israeli border stamps or entry/exit records may cause issues at some Arab countries. Extensive security questioning on arrival. Dual nationals should check requirements.',
        laws: 'Same-sex civil partnerships recognised but not marriage. Security forces have extensive powers. Photography near military sites prohibited.'
      }
    },

    /* ── Women Traveller Safety ───────────────────────────────────── */
    womenSafety: {
      france: {
        score: 7, label: 'Generally Safe',
        tips: ['Street harassment (harcèlement) is common in some areas — ignore and keep walking', 'Paris public transport is safe but take front carriage at night', 'Catcalling has been criminalised since 2018 — you can report incidents to police', 'Avoid isolated areas of Paris suburbs at night'],
        dressCode: 'No restrictions. Dress as you would at home.'
      },
      spain: {
        score: 7, label: 'Generally Safe',
        tips: ['Relatively safe for solo women', 'Drink spiking reported in Ibiza and Magaluf party venues — never leave your drink', 'Festival and night-out areas require the same vigilance as any European city', 'Trust your instincts — the \'mate\' system (going out with a buddy) is common among locals'],
        dressCode: 'No restrictions. Cover shoulders when entering churches.'
      },
      italy: {
        score: 7, label: 'Generally Safe',
        tips: ['Verbal harassment (catcalling) is common, especially in Southern Italy', 'Avoid walking alone at night in less-touristed areas', 'Be firm but don\'t engage with persistent strangers', 'Tourist police (Carabinieri) are generally responsive to reports'],
        dressCode: 'Cover shoulders and knees when entering churches and religious sites.'
      },
      portugal: {
        score: 8, label: 'Safe',
        tips: ['One of the safer European destinations for women', 'Lisbon and Porto are very walkable and safe at night', 'Night bus and metro are generally safe', 'Beach areas during summer can have some harassment'],
        dressCode: 'No restrictions. Casual dress is fine throughout.'
      },
      greece: {
        score: 7, label: 'Generally Safe',
        tips: ['Athens can have catcalling but is generally safe', 'Island nightlife can be rowdy — travel in groups', 'Drink spiking reported in tourist bar areas', 'Local women\'s dress varies by region — islanders tend to be casual'],
        dressCode: 'Cover shoulders at monasteries and churches. Modesty expected at some sites.'
      },
      japan: {
        score: 8, label: 'Safe',
        tips: ['Women-only train carriages available on most major lines during rush hour — look for pink markings', 'Very low street crime but chikan (groping on trains) is a known issue — report to train staff', 'Solo dining and travel are completely normal and well-catered for', 'Locals are very helpful if approached for directions'],
        dressCode: 'No restrictions but dress modestly at temples and shrines.'
      },
      thailand: {
        score: 6, label: 'Moderate Care Required',
        tips: ['Generally friendly to solo women travellers', 'Avoid isolated beaches and poorly-lit areas at night', 'Full Moon Party events require extreme vigilance — drink spiking incidents reported', 'Use registered taxis or Grab app — avoid unmarked vehicles', 'Be cautious of overly friendly strangers who invite you to private bars'],
        dressCode: 'Cover shoulders and knees when visiting temples (sarongs often available to borrow). Modest dress in rural villages.'
      },
      indonesia: {
        score: 5, label: 'Extra Care Required',
        tips: ['Bali is relatively safe for solo women but exercise caution in quiet areas', 'Sexual harassment can occur — trust your instincts and move away', 'Avoid accepting rides from unofficial motorbike taxis', 'Use reputable tour operators for excursions', 'Dress modestly outside of beach areas and resorts'],
        dressCode: 'Cover shoulders and legs outside of beach resorts and tourist areas. Required at temples (sashes/sarongs provided). Particularly strict in Aceh province (Sharia law).'
      },
      india: {
        score: 4, label: 'High Vigilance Required',
        tips: ['Sexual assault and harassment are serious risks — particularly in North India cities at night', 'Dress very conservatively — loose, modest clothing covering arms and legs', 'Avoid travelling alone after dark — book taxis via app and share trip details', 'Avoid isolated tourist sites alone — go in groups or with registered guides', 'Trust your instincts — if uncomfortable, leave immediately', 'The Nirbhaya Fund provides emergency assistance to women in distress'],
        dressCode: 'Dress very conservatively — cover arms, legs, and wear a dupatta/scarf in conservative areas. Required at all temples and religious sites.'
      },
      uae: {
        score: 6, label: 'Moderate Care Required',
        tips: ['Relatively safe physical environment but culturally conservative laws apply', 'Public displays of affection are illegal', 'Dress modestly outside of beaches and hotels — shoulders and knees covered', 'Alcohol only permitted in licensed venues', 'Solo women can travel freely but respect local cultural norms'],
        dressCode: 'Modesty essential in public — cover shoulders and knees. Abayas not required but modest dress is. Swimwear appropriate at hotel pools and beaches only.'
      },
      morocco: {
        score: 5, label: 'Extra Care Required',
        tips: ['Street harassment is very common in medinas and tourist areas', 'Wear modest clothing to reduce unwanted attention', 'Hire a licensed guide for medina navigation — unofficial guides often lead to commission shops', 'Solo dining is fine in tourist restaurants but may attract stares in local establishments', 'Avoid empty alleys in medinas especially after dark'],
        dressCode: 'Cover shoulders and wear loose trousers or long skirts in medinas. Headscarves not required for non-Muslims but appreciated in rural areas.'
      },
      egypt: {
        score: 4, label: 'High Vigilance Required',
        tips: ['Sexual harassment is extremely common — catcalling, touching, and following', 'Dress very conservatively, especially outside of resort areas', 'Never accept offers from strangers to visit their shop or home', 'Use registered taxis or hotel cars — never hail from the street', 'Travel in groups whenever possible', 'Report serious incidents to the Tourist Police (126)'],
        dressCode: 'Cover arms and legs everywhere except at Red Sea resort pools and beaches. Loose, dark clothing recommended. Scarf useful in conservative areas.'
      },
      south_africa: {
        score: 4, label: 'High Vigilance Required',
        tips: ['Very high risk of violent crime — never walk alone at night', 'Keep valuables hidden and do not display phones or jewellery', 'Use Uber rather than street taxis in cities', 'Stay in secure accommodation and use hotel transport when possible', 'Join guided tours for township visits and hiking'],
        dressCode: 'No dress code restrictions but dress practically and avoid conspicuous clothing/accessories.'
      },
      kenya: {
        score: 5, label: 'Extra Care Required',
        tips: ['Generally respectful of women in tourist areas', 'Avoid walking alone at night in Nairobi', 'Mombasa and Coast region are more conservative — dress accordingly', 'Safari areas are very safe — stay with tour operators', 'Use official taxis or apps — avoid street cabs'],
        dressCode: 'Casual dress fine in Nairobi and tourist areas. Modest dress (cover legs) on the Coast and in Muslim-majority areas.'
      },
      turkey: {
        score: 5, label: 'Extra Care Required',
        tips: ['Harassment varies significantly by region — Istanbul tourist areas generally safe', 'Conservative dress recommended outside of Istanbul and coastal resorts', 'Avoid accepting invites from strangers, especially involving carpet shops or tea invitations', 'Solo travel is more comfortable in tourist-heavy cities', 'The tourist police are responsive in major cities'],
        dressCode: 'Cover shoulders and knees when visiting mosques (headscarves required for women). Dress modestly in rural and conservative areas.'
      },
      vietnam: {
        score: 7, label: 'Generally Safe',
        tips: ['Generally very safe for solo women travellers', 'Bag snatching by motorbike is a risk — hold bags on the side away from the road', 'Avoid dark alleys at night', 'Local women are very conservative — dressing modestly will earn more respect', 'Locals are very helpful and friendly'],
        dressCode: 'Cover shoulders and knees when visiting pagodas, temples, and religious sites. Modest dress earns respect in rural areas.'
      },
      malaysia: {
        score: 6, label: 'Moderate Care Required',
        tips: ['Generally safe in KL tourist areas', 'Dress conservatively especially in Malay and Islamic cultural areas', 'Avoid walking alone at night in less-touristy parts of KL', 'Eastern Sabah carries kidnapping risk — check FCO advice', 'Female-only taxis available through apps'],
        dressCode: 'Cover shoulders and knees when visiting mosques (headscarves required at entry). Modest dress in conservative areas. Casual fine in KL shopping districts.'
      },
      singapore: {
        score: 9, label: 'Very Safe',
        tips: ['Extremely safe even late at night', 'Public transport and taxis are reliable and safe', 'Very walkable city with excellent street lighting', 'Zero tolerance crime laws create a genuinely safe environment'],
        dressCode: 'No restrictions for tourists though modest dress is appreciated at temples and mosques.'
      },
      australia: {
        score: 8, label: 'Safe',
        tips: ['Very safe for solo women travellers', 'Exercise same precautions as any Western city — trust your instincts', 'Sun protection is critical — UV index is extreme', 'Wildlife awareness essential in rural areas', 'Water safety: follow beach flags and lifeguard advice'],
        dressCode: 'No restrictions.'
      },
      new_zealand: {
        score: 8, label: 'Safe',
        tips: ['One of the safer countries for women travellers', 'Exercise normal precautions in city centres at night', 'Natural hazards are the main risk — always tell someone your hiking plans', 'Weather can change rapidly — always be prepared in alpine areas'],
        dressCode: 'No restrictions.'
      },
      iceland: {
        score: 10, label: 'Exceptionally Safe',
        tips: ['Consistently ranked the world\'s safest country for women', 'Solo travel completely normal at any hour', 'Very progressive gender equality culture', 'Natural hazards (geothermal, weather) are the primary concern — always check conditions'],
        dressCode: 'No restrictions.'
      },
      usa: {
        score: 7, label: 'Generally Safe',
        tips: ['Safety varies dramatically by city and neighbourhood — research your specific destination', 'Avoid walking alone at night in unfamiliar areas', 'Trust your instincts and be aware of your surroundings', 'Emergency: always call 911', 'Rideshare apps (Uber/Lyft) are widely available and safe'],
        dressCode: 'No restrictions.'
      },
      canada: {
        score: 8, label: 'Safe',
        tips: ['Very safe for solo women travellers', 'Exercise normal urban precautions in downtown areas at night', 'Excellent public transport safety', 'Indigenous communities require cultural respect'],
        dressCode: 'No restrictions.'
      },
      brazil: {
        score: 5, label: 'Extra Care Required',
        tips: ['High crime means extra vigilance is required', 'Avoid displaying expensive jewellery or electronics', 'Never walk alone at night in unfamiliar areas', 'Use Uber rather than street taxis', 'Carnival season requires extra vigilance against harassment and theft'],
        dressCode: 'No restrictions but dress practically to avoid attention.'
      },
      jordan: {
        score: 5, label: 'Extra Care Required',
        tips: ['Generally safe but conservative culture means harassment can occur', 'Dress modestly to reduce unwanted attention', 'Wadi Rum and Petra are safe tourist areas', 'Solo female travel is possible but conservative dress is important', 'Petra at night is safe with the organised candlelit tour'],
        dressCode: 'Cover shoulders and knees in public. Headscarves not required but appreciated in conservative areas and when visiting mosques.'
      },
      israel: {
        score: 7, label: 'Generally Safe',
        tips: ['Tel Aviv is very progressive and safe for women', 'Jerusalem\'s Old City requires modest dress in religious quarters', 'Security checks are extensive but respectful', 'Ultra-Orthodox Jewish areas require very conservative dress', 'Be aware of security situation — follow all local guidance'],
        dressCode: 'Modest dress in Old Jerusalem, the Western Wall, and ultra-Orthodox neighbourhoods. Casual dress is fine in Tel Aviv.'
      }
    },

    /* ── Scam Database ───────────────────────────────────────────── */
    scams: {
      france: [
        { name: 'Petition Scam', type: 'Distraction', description: 'A person (often a child) approaches with a petition or survey to sign. While distracted, accomplices steal from your pockets or bag.', howToAvoid: 'Decline firmly and keep walking. Never stop for strangers approaching with clipboards or tablets.', severity: 'medium' },
        { name: 'Gold Ring Scam', type: 'Con', description: 'A stranger "finds" a gold ring on the ground and offers it to you. They then ask for money for "good luck" or claim it is a valuable find they are willing to share — for a price.', howToAvoid: 'Ignore and keep walking. The ring is fake.', severity: 'low' },
        { name: 'Friendship Bracelet', type: 'Con', description: 'Men near Sacré-Cœur tie a bracelet around your wrist before you can say no, then demand payment for it.', howToAvoid: 'Keep your hands in your pockets in tourist areas and walk away quickly if approached.', severity: 'low' }
      ],
      spain: [
        { name: 'La Rambla Pickpockets', type: 'Theft', description: 'Organised pickpocket gangs operate throughout La Rambla in Barcelona. They work in teams — one distracts while another steals.', howToAvoid: 'Keep bags in front, use money belt, avoid back pockets. Be particularly alert at buskers and performers.', severity: 'high' },
        { name: 'Friendship Bracelet', type: 'Con', description: 'Same as the Paris version — men tie bracelets on your wrist and demand payment.', howToAvoid: 'Decline firmly and keep hands moving or in pockets.', severity: 'low' },
        { name: 'Bump and Steal', type: 'Theft', description: 'Someone bumps into you apologetically while an accomplice picks your pocket or bag during the confusion.', howToAvoid: 'Be alert after any physical contact with strangers. Hold your bag tightly.', severity: 'medium' }
      ],
      italy: [
        { name: 'Gladiator Photo Scam (Rome)', type: 'Con', description: 'Men in gladiator costumes near the Colosseum offer to take photos with you. They then demand an outrageous fee — and become aggressive if you refuse.', howToAvoid: 'Agree on price before any photo. Safest is to decline entirely.', severity: 'medium' },
        { name: 'Rose/Gift Scam', type: 'Con', description: 'A stranger presses a rose or small gift into your hand, then demands payment claiming "it\'s a gift from my heart."', howToAvoid: 'Never accept anything from strangers on the street.', severity: 'low' },
        { name: 'Tourist Trap Restaurants', type: 'Overcharging', description: 'Restaurants near major tourist sites in Rome, Venice, and Florence charge extreme prices and may add hidden service charges.', howToAvoid: 'Walk a few streets from tourist hotspots. Check menus (including cover charges and service) before sitting.', severity: 'medium' }
      ],
      thailand: [
        { name: 'Tuk-Tuk Gem Tour', type: 'Con', description: 'A friendly tuk-tuk driver offers a suspiciously cheap ride and "helpful" advice — taking you to a gem shop or tailor where you\'re pressured to buy overpriced goods.', howToAvoid: 'Book tuk-tuks at set rates. Decline any offer to visit a "friend\'s shop" or "special deal today."', severity: 'high' },
        { name: '"Grand Palace is Closed" Scam', type: 'Con', description: 'A well-dressed local approaches and tells you a major attraction is closed today (it never is). They then offer to take you somewhere "better" — a gem shop or their "cousin\'s" business.', howToAvoid: 'Check official attraction websites or your hotel. If told an attraction is closed, verify yourself.', severity: 'high' },
        { name: 'Fake Monk', type: 'Con', description: 'Men in monk robes approach tourists for donations and offer "blessings." Real monks do not solicit donations from strangers.', howToAvoid: 'Decline politely. Real monks do not approach tourists for money.', severity: 'medium' }
      ],
      turkey: [
        { name: 'Shoe Shine Scam', type: 'Con', description: 'A shoe shiner drops his brush near you "accidentally." When you return it, he insists on shining your shoes as thanks — then demands a high fee.', howToAvoid: 'If you see a dropped brush, point it out verbally but don\'t pick it up.', severity: 'low' },
        { name: 'Carpet / Tea Invitation', type: 'Con', description: 'A friendly local invites you for tea or to "just look" at their shop. You are then given a hard-sell carpet or jewellery pitch.', howToAvoid: 'You can accept tea and enjoy the culture, but be very firm that you are not buying. Leave if pressure intensifies.', severity: 'medium' },
        { name: 'Overcharging Taxi', type: 'Overcharging', description: 'Taxis from Istanbul\'s tourist areas (Sultanahmet, Taksim) often charge tourists 5-10x the correct fare.', howToAvoid: 'Use the BiTaksi or Uber apps for price transparency. Always agree on metered fare before entering.', severity: 'medium' }
      ],
      egypt: [
        { name: 'Camel Ride Price Ambush', type: 'Con', description: 'You are helped onto a camel for a "short ride" at the pyramids. The camel is then walked to a remote spot and the driver demands hundreds of dollars to bring you back.', howToAvoid: 'Only use camel/horse operators with fixed prices displayed. Agree on price AND route before mounting.', severity: 'high' },
        { name: 'Fake Papyrus', type: 'Overcharging', description: 'Most "papyrus" sold in Egypt is cheap banana leaf paper. Sellers use high-pressure tactics to sell it at inflated prices.', howToAvoid: 'Only buy papyrus from certified shops. Real papyrus can be dented without cracking.', severity: 'low' },
        { name: 'Baksheesh Everything', type: 'Overcharging', description: 'Spontaneous "helpers" who open doors, take photos, or give unrequested information will demand money. The amount often escalates rapidly.', howToAvoid: 'Decline any unsolicited help firmly. If you accept help, agree on payment first or decline.', severity: 'medium' }
      ],
      india: [
        { name: 'Auto-Rickshaw Meter Scam', type: 'Overcharging', description: 'Drivers claim the meter is broken, quote a high flat rate, or take unnecessarily long routes to overcharge.', howToAvoid: 'Insist on the meter or use Ola/Uber apps. Pre-agree rates with hotel concierge.', severity: 'high' },
        { name: 'Gem Export Scheme', type: 'Con', description: 'A "student" befriends you and eventually involves you in a "gem export scheme" promising huge profits. You end up paying for worthless stones or facilitating fraud.', howToAvoid: 'Never participate in any business deal proposed by a new acquaintance.', severity: 'high' },
        { name: 'Fake Tourist Office', type: 'Con', description: 'Near train stations, "government tourist offices" help book tours and onward transport at inflated prices. Many are private agencies posing as official.', howToAvoid: 'Book transport and tours only through your hotel or official IRCTC website.', severity: 'high' }
      ],
      morocco: [
        { name: 'Fake Guide Scam', type: 'Con', description: 'An unsolicited "guide" in the medina leads you through alleys and takes you to commission-paying shops, then demands payment for guiding services you didn\'t request.', howToAvoid: 'Hire guides only through your riad (guesthouse) or official guide services. Say "no thank you" firmly to unsolicited help.', severity: 'high' },
        { name: 'Henna Ambush', type: 'Con', description: 'Women approach and begin applying henna to your hand without asking. They then demand very high payment for the design.', howToAvoid: 'Pull away immediately if anyone reaches for your hand without permission.', severity: 'medium' },
        { name: 'Carpet Shop Pressure', type: 'Overcharging', description: 'After entering a carpet shop (often accompanied by your "guide"), you\'re plied with mint tea and subjected to hours of high-pressure sales tactics.', howToAvoid: 'You can always leave. "Thank you, I\'m just looking" is valid. Have an escape plan (meet a friend, have a call to take).', severity: 'medium' }
      ],
      indonesia: [
        { name: 'Money Changer Short-Change', type: 'Fraud', description: 'Unofficial money changers in Bali use sleight of hand or distraction to shortchange tourists. Official-looking boards display great rates to lure in tourists.', howToAvoid: 'Use ATMs or licensed bank money changers only. Count your money carefully before leaving the counter.', severity: 'high' },
        { name: '"Road Closed" Redirect', type: 'Con', description: 'A local tells you that the road to a temple is closed for a ceremony. They then redirect you to a "relative\'s art shop" instead.', howToAvoid: 'Verify any "closures" with your hotel or online. Temples are rarely fully closed to tourists.', severity: 'medium' },
        { name: 'Unofficial Transport Overcharging', type: 'Overcharging', description: 'Unofficial taxis at Bali airport and tourist areas charge many times the correct fare. Drivers may also take long routes.', howToAvoid: 'Use the official blue Bluebird taxis, or Grab/Gojek apps with fixed prices.', severity: 'medium' }
      ],
      mexico: [
        { name: 'ATM Skimming', type: 'Fraud', description: 'Devices fitted to ATMs steal your card data. This is common at tourist areas and airport ATMs.', howToAvoid: 'Use ATMs inside bank branches during business hours only. Inspect the card reader for anything loose or unusual.', severity: 'high' },
        { name: 'Express Kidnapping', type: 'Crime', description: 'Unofficial taxis or strangers offer rides and take victims to ATMs to withdraw money at gunpoint before releasing them. Common in Mexico City.', howToAvoid: 'Only use official taxi stands (sitio taxis) booked through your hotel or verified apps like DiDi or Uber. Never hail from the street.', severity: 'high' },
        { name: 'Tourist Police Impersonators', type: 'Con', description: 'People posing as police demand to inspect your wallet for "counterfeit bills" — and pocket your cash.', howToAvoid: 'Real police do not inspect wallets on the street. Never hand over your wallet. If stopped by "police," request to go to the nearest police station.', severity: 'high' }
      ],
      south_africa: [
        { name: '"Helpful" ATM Strangers', type: 'Fraud', description: 'Strangers at ATMs offer "help" when your card is apparently stuck — using distraction to steal your card or see your PIN.', howToAvoid: 'Only use ATMs at bank branches. Never accept help from strangers at ATMs. Shield your PIN always.', severity: 'high' },
        { name: 'Car Park Distraction', type: 'Theft', description: 'Strangers approach your car in car parks with questions or "help" — while accomplices break into or steal from your vehicle.', howToAvoid: 'Park in guarded car parks. Keep valuables out of sight. Be alert when approached in parking areas.', severity: 'high' }
      ],
      usa: [
        { name: 'CD Hustle (NYC)', type: 'Con', description: 'Men on streets in Times Square and other tourist areas force CDs into your hands and then demand money — becoming aggressive if refused.', howToAvoid: 'Do not take anything handed to you on the street. Say "no thank you" firmly and keep walking.', severity: 'medium' },
        { name: 'Fake Charity Collections', type: 'Con', description: 'Clipboard carriers collecting for fake charities target tourists at major landmarks.', howToAvoid: 'Only donate to registered charities through their official channels.', severity: 'low' }
      ],
      brazil: [
        { name: 'Distraction Theft (Rio)', type: 'Theft', description: 'Teams of thieves work on Ipanema and Copacabana beaches — one engages you in conversation while others steal your belongings.', howToAvoid: 'Use beach lockers at your hotel or resort. Bring only what you need. Never take passports or expensive electronics to the beach.', severity: 'high' },
        { name: 'Pirate Taxis', type: 'Crime', description: 'Unofficial taxi drivers at airports and bus stations may overcharge, rob, or worse. Rio de Janeiro has documented cases of tourist robberies by pirate taxis.', howToAvoid: 'Only use 99 app, Uber, or pre-arranged hotel transport. Never accept rides from men who approach you in transport hubs.', severity: 'high' }
      ],
      colombia: [
        { name: 'Scopolamine (Burundanga)', type: 'Crime', description: 'A drug that causes temporary incapacitation and memory loss, slipped into drinks or food. Victims are then robbed or worse. Primarily a risk in Bogota nightlife.', howToAvoid: 'Never accept food or drinks from strangers. Cover your drink in clubs. Do not accept cigarettes from unknown people. Arrive at clubs with people you trust.', severity: 'high' },
        { name: 'Fake Police (Bogota)', type: 'Con', description: '"Police officers" in plain clothes demand to inspect your drugs or wallet for counterfeit money. They steal your cash.', howToAvoid: 'Real Colombian police do not conduct random searches of foreigners. Request to go to the nearest police station. Call 123 (emergency) if threatened.', severity: 'high' }
      ],
      peru: [
        { name: 'Taxi Ambush', type: 'Overcharging', description: 'Unlicensed taxis near major attractions quote standard prices but dramatically overcharge — or drive to remote areas and demand payment to return.', howToAvoid: 'Use the InDriver or Uber app. Book taxis through your hotel. Agree on ALL terms (price, destination, route) before getting in.', severity: 'high' },
        { name: 'Currency Confusion', type: 'Fraud', description: 'Some traders attempt to confuse tourists with soles/dollars exchange rates, giving change in incorrect currency or at unfavourable rates.', howToAvoid: 'Learn the rough exchange rate. Pay exact amounts where possible. Count change before leaving.', severity: 'medium' }
      ],
      vietnam: [
        { name: 'Motorbike Bag Snatch', type: 'Theft', description: 'Thieves on motorbikes ride past pedestrians and snatch bags, phones, or jewelry. One of the most common crimes against tourists in Hanoi and Ho Chi Minh City.', howToAvoid: 'Walk with your bag on the wall side of the pavement. Keep phones hidden. Use a cross-body bag with your hand on the clasp.', severity: 'high' },
        { name: 'Cyclo Price Ambush', type: 'Overcharging', description: 'Cyclo (rickshaw) drivers accept tourists\'s agreed price but then demand 10x the amount at the destination, sometimes threatening to go to the police.', howToAvoid: 'Write down the agreed price and show to driver before departing. Have exact change ready.', severity: 'medium' }
      ],
      greece: [
        { name: 'Bar Scam (Athens)', type: 'Con', description: 'Attractive locals in Athens streets (near Syntagma) strike up conversation and suggest a bar they "know." Drinks arrive at enormous prices; the "local" is in on the scam.', howToAvoid: 'Do not follow strangers to bars or clubs they recommend, especially in central Athens at night.', severity: 'high' },
        { name: 'Fake Police', type: 'Con', description: 'Plainclothes "police officers" request to inspect wallets for counterfeit currency. Real police do not do this to tourists on the street.', howToAvoid: 'Ask for police ID (ταυτότητα). Request to go to a police station. Call 100 if threatened.', severity: 'medium' }
      ],
      czech_republic: [
        { name: 'Taxi Overcharging (Prague)', type: 'Overcharging', description: 'Taxis from tourist areas, especially Wenceslas Square and tourist bars, charge massively inflated prices. Some taxis have rigged meters.', howToAvoid: 'Use Bolt or Uber in Prague. Only take official taxis with company names on the side and the fare schedule displayed inside.', severity: 'high' },
        { name: 'Short-Change Trick', type: 'Fraud', description: 'Some bars and exchange offices use confusion over Czech Koruna notes (which look similar in different denominations) to short-change tourists.', howToAvoid: 'Familiarise yourself with Czech banknotes before paying. Count your change carefully.', severity: 'medium' }
      ],
      malaysia: [
        { name: 'Gem Investment Scam (KL)', type: 'Con', description: 'A new "friend" introduces you to a gem investment opportunity promising high returns. The gems are worth far less than you pay.', howToAvoid: 'Never invest in gems or unusual financial schemes proposed by new acquaintances abroad.', severity: 'high' },
        { name: 'Short Change at Markets', type: 'Fraud', description: 'At busy night markets, traders use rapid transactions and distraction to short-change tourists.', howToAvoid: 'Always count your change. Use exact amounts where possible.', severity: 'low' }
      ],
      japan: [
        { name: 'Hostess / Okama Bar', type: 'Overcharging', description: 'In Tokyo\'s entertainment districts (Kabukicho, Roppongi), friendly women invite men to "nice bars." Bills of thousands of dollars appear for a few drinks, enforced by intimidation.', howToAvoid: 'Do not follow strangers to bars. Book venues that are clearly signposted with menus displayed. Stick to recommendations from your hotel.', severity: 'high' }
      ]
    },

    /* ── Vaccination Requirements ─────────────────────────────────── */
    vaccinations: {
      france: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements. EHIC/GHIC recommended.' },
      spain: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      italy: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      portugal: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      greece: { required: [], recommended: ['Hepatitis A', 'Standard UK vaccinations'], notes: 'Risk very low but hepatitis A cases reported.' },
      germany: { required: [], recommended: ['Tick-borne Encephalitis (TBE) for forest areas', 'Standard UK vaccinations'], notes: 'TBE risk in wooded areas of southern Germany, Bavaria, and Baden-Württemberg.' },
      netherlands: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      belgium: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      austria: { required: [], recommended: ['TBE for forest areas', 'Standard UK vaccinations'], notes: 'TBE risk in forested areas — vaccination recommended if hiking.' },
      switzerland: { required: [], recommended: ['TBE for forest areas', 'Standard UK vaccinations'], notes: 'TBE risk in forested/rural areas.' },
      sweden: { required: [], recommended: ['TBE for forest areas', 'Standard UK vaccinations'], notes: 'TBE risk in archipelago and forest areas May–September.' },
      norway: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      denmark: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      finland: { required: [], recommended: ['TBE for outdoor activities', 'Standard UK vaccinations'], notes: 'TBE risk in Åland Islands and some coastal areas.' },
      iceland: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements. Extremely clean country.' },
      ireland: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      czech_republic: { required: [], recommended: ['TBE for rural areas', 'Standard UK vaccinations'], notes: 'TBE risk in forested and rural areas.' },
      poland: { required: [], recommended: ['TBE for forested areas', 'Standard UK vaccinations'], notes: 'TBE risk in northeastern forests (Białowieża).' },
      hungary: { required: [], recommended: ['TBE for rural areas', 'Standard UK vaccinations'], notes: 'TBE risk in some rural areas.' },
      romania: { required: [], recommended: ['Hepatitis A', 'Rabies (for rural animal contact)', 'TBE for forests', 'Standard UK vaccinations'], notes: 'Rabies risk from stray dogs exists. Avoid contact with animals.' },
      croatia: { required: [], recommended: ['Hepatitis A', 'Standard UK vaccinations'], notes: 'No specific requirements for most travellers.' },
      turkey: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Standard UK vaccinations'], notes: 'Hepatitis A and typhoid recommended. Rabies risk in rural areas.' },
      usa: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements. COVID-19 vaccination status may be required for some venues.' },
      canada: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      mexico: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Standard UK vaccinations'], notes: 'Zika virus risk — relevant for pregnant travellers or those planning pregnancy. Malaria risk in some rural areas.' },
      brazil: { required: ['Yellow Fever (from certain countries)', 'Yellow Fever recommended for Amazon travel'], recommended: ['Hepatitis A', 'Typhoid', 'Malaria prophylaxis for Amazon'], notes: 'Yellow Fever vaccination certificate required if arriving from some African/South American countries. Essential for Amazon travel.' },
      argentina: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Yellow Fever for Iguazú and northern regions'], notes: 'Yellow Fever recommended for northern subtropical regions.' },
      peru: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Altitude sickness medication', 'Yellow Fever for Amazon', 'Malaria prophylaxis for jungle'], notes: 'Altitude sickness prevention essential for Cusco and Machu Picchu (3,400m+). Consult your GP before travel.' },
      colombia: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Yellow Fever for some regions', 'Malaria for some rural areas', 'Dengue awareness'], notes: 'Yellow Fever required for some national parks. Zika risk — check current guidance.' },
      costa_rica: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Standard UK vaccinations'], notes: 'Dengue risk. No malaria in main tourist areas. Rabies risk from wildlife.' },
      japan: { required: [], recommended: ['Standard UK vaccinations', 'Japanese Encephalitis for rural stays of 30+ days'], notes: 'Extremely clean country. Japanese Encephalitis vaccine only needed for extended rural stays.' },
      thailand: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Rabies (if near animals)', 'Japanese Encephalitis for rural stays'], notes: 'Malaria prophylaxis for border regions (Myanmar, Cambodia). Dengue is common — use repellent throughout.' },
      indonesia: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Rabies (Bali)', 'Japanese Encephalitis for rural areas'], notes: 'Malaria in rural areas outside Bali. Rabies from monkeys at temples is a real risk in Bali — seek immediate treatment for any bite or scratch.' },
      vietnam: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Rabies for rural areas', 'Japanese Encephalitis for rural stays'], notes: 'Malaria risk in rural highland areas and border regions. Dengue throughout the country.' },
      malaysia: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Japanese Encephalitis for Sabah/rural'], notes: 'Malaria in Sabah and rural Sarawak. Dengue throughout. Rabies in Sabah (avoid animal contact).' },
      singapore: { required: [], recommended: ['Standard UK vaccinations'], notes: 'Very low risk country. Dengue present — use mosquito repellent.' },
      india: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Tetanus', 'Rabies', 'Malaria prophylaxis for most regions', 'Japanese Encephalitis for rural areas'], notes: 'One of the highest-risk destinations for travellers\' diarrhoea. Seek medical advice before travel. Cholera vaccine may be recommended.' },
      sri_lanka: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Rabies', 'Japanese Encephalitis for rural areas'], notes: 'Dengue throughout. Malaria in Northern Province.' },
      maldives: { required: [], recommended: ['Hepatitis A', 'Standard UK vaccinations'], notes: 'Very low risk at resort islands. Comprehensive medical evacuation insurance essential.' },
      uae: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements. Healthcare is excellent.' },
      australia: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific vaccine requirements but all standard UK vaccinations should be up to date.' },
      new_zealand: { required: [], recommended: ['Standard UK vaccinations'], notes: 'No specific requirements.' },
      south_africa: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Malaria prophylaxis for game reserves', 'Rabies for wildlife areas'], notes: 'Malaria risk in Kruger National Park and Limpopo. Yellow Fever required if arriving from infected countries.' },
      kenya: { required: ['Yellow Fever (if arriving from infected country)'], recommended: ['Hepatitis A', 'Typhoid', 'Malaria prophylaxis (essential throughout)', 'Rabies'], notes: 'Malaria prophylaxis is absolutely essential for all of Kenya. Yellow Fever certificate required.' },
      tanzania: { required: ['Yellow Fever (recommended and required from infected countries)'], recommended: ['Hepatitis A', 'Typhoid', 'Malaria prophylaxis (essential)', 'Rabies for wildlife areas'], notes: 'Malaria is a serious risk throughout Tanzania. Schistosomiasis risk in freshwater lakes (Lake Victoria, Malawi).' },
      morocco: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Rabies for rural areas'], notes: 'Tap water unsafe — drink bottled only. Gastrointestinal illness common.' },
      egypt: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Standard UK vaccinations'], notes: 'Tap water unsafe. Gastrointestinal illness very common. Rabies risk in rural areas.' },
      ghana: { required: ['Yellow Fever'], recommended: ['Hepatitis A', 'Typhoid', 'Malaria prophylaxis (essential)', 'Rabies'], notes: 'Yellow Fever vaccination certificate is mandatory for entry. Malaria prophylaxis essential throughout Ghana.' },
      jordan: { required: [], recommended: ['Hepatitis A', 'Typhoid', 'Standard UK vaccinations'], notes: 'No specific requirements. Healthcare adequate in Amman.' },
      israel: { required: [], recommended: ['Standard UK vaccinations', 'Hepatitis A'], notes: 'Excellent healthcare. No specific requirements.' }
    }
  };
})();
