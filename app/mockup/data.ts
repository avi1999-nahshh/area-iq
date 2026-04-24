// Shared Koramangala mock data for all direction explorations
export const KORAMANGALA = {
  pincode: "560034",
  name: "Koramangala",
  fullName: "Koramangala I Block",
  district: "Bangalore",
  state: "Karnataka",
  archetype: "The Hustler's Hub",
  archetypeEmoji: "🚀",
  grade: "D+",
  overall: 45,
  tier: "Urban Prime",
  nationalRank: 16723,
  nationalTotal: 19928,
  nationalPct: 16,           // bottom 16%
  superlative: "Karnataka's Top Amenity Hub",
  date: "April 2026",
  edition: "VOL II · NO. 42",

  scores: {
    air: 7,
    safety: 44,
    infra: 99,
    transit: 49,
    cleanliness: 14,
    property: 100,
  },

  stats: {
    aqi: 185,
    rentMonth: 28000,
    populationLakh: 9.9,
    literacyPct: 70,
    commutePct: 66,
    fiveMin: 8,
    crimePerLakh: 950,
  },

  amenities: {
    hospitals: 14,
    clinics: 10,
    schools: 15,
    parks: 1,
    malls: 2,
    cafes: 27,
    restaurants: 56,
    banks: 35,
    atms: 11,
    busStops: 51,
    pharmacies: 13,
  },

  transit: {
    metroKm: 1.55,
    metroName: "Central Silk Board",
    railwayKm: 7.66,
    railwayName: "Baiyyappanahalli Junction",
  },

  representative: {
    name: "Tejasvi Surya",
    party: "BJP",
    constituency: "Bangalore South",
  },

  verdict:
    "An amenity hub choked by its own air. Koramangala holds 99th-percentile infrastructure nationally — yet ranks in the bottom 3% for air quality, and the BBMP's Swachh score puts cleanliness in the bottom 14%.",

  narrative:
    "Koramangala is an always-on block. Startups colonise cafés past midnight; scooter deliveries thicken the arterials all day; the 100 Feet Road exists on its own chronotope. In return for being India's most concentrated amenity corridor, residents trade a breathable sky and tolerate a civic waste infrastructure permanently one complaint behind demand. The archetype is a hustler's hub — rewarding for the ambitious, punishing for anyone who wants to age slowly.",

  facts: [
    "Bengaluru's official name change from 'Bangalore' on November 1, 2014, means its current identity is younger than WhatsApp, which launched in 2009.",
    "Despite covering just 0.45% of India's total land area, Bengaluru district alone accounts for over 30% of India's total IT exports.",
    "Bengaluru sits at an average elevation of 920 metres (3,018 feet) above sea level, making it one of the highest major metropolitan cities in India — significantly higher than Delhi (216m) or Mumbai (14m).",
  ],
};

export type KoramangalaData = typeof KORAMANGALA;
