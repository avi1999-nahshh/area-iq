import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── waitlist (existing) ──────────────────────────────
  waitlist: defineTable({
    email: v.string(),
    joinedAt: v.number(),
  }).index("by_email", ["email"]),

  // ── pincode master ───────────────────────────────────
  pincodes: defineTable({
    pincode: v.string(),
    name: v.string(),
    district: v.string(),
    state: v.string(),
    lat: v.number(),
    lng: v.number(),
    area_sq_km: v.optional(v.number()),
    urban_rural: v.optional(v.string()),
    metro_city: v.optional(v.string()), // "Bengaluru" | "Mumbai" | null
  })
    .index("by_pincode", ["pincode"])
    .index("by_district", ["district"])
    .index("by_state", ["state"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["district", "state", "metro_city"],
    }),

  // ── census demographics ──────────────────────────────
  census: defineTable({
    pincode: v.string(),
    district: v.string(),
    state: v.string(),
    population: v.number(),
    population_male: v.number(),
    population_female: v.number(),
    gender_ratio: v.number(),
    population_density: v.optional(v.number()),
    literacy_rate: v.number(),
    literacy_rate_female: v.number(),
    household_count: v.number(),
    avg_household_size: v.number(),
    worker_participation_rate: v.number(),
    commute_under_30_pct: v.number(),
    commute_30_60_pct: v.number(),
    commute_1_2hr_pct: v.number(),
    commute_2plus_pct: v.number(),
  }).index("by_pincode", ["pincode"]),

  // ── air quality ──────────────────────────────────────
  air_quality: defineTable({
    pincode: v.string(),
    station_id: v.string(),
    station_name: v.string(),
    station_distance_km: v.number(),
    aqi: v.optional(v.number()),
    pm25: v.optional(v.number()),
    pm10: v.optional(v.number()),
    no2: v.optional(v.number()),
    so2: v.optional(v.number()),
    o3: v.optional(v.number()),
    updated_at: v.number(),
  }).index("by_pincode", ["pincode"]),

  // ── safety ───────────────────────────────────────────
  safety: defineTable({
    pincode: v.string(),
    district: v.string(),
    crime_rate_per_lakh: v.number(),
    murder_rate: v.number(),
    theft_rate: v.number(),
    crimes_against_women_rate: v.number(),
    nearest_police_station_km: v.number(),
    nearest_police_station_name: v.optional(v.string()),
    crime_data_source: v.optional(v.string()), // "district" | "state" | "national"
    data_year: v.number(),
  }).index("by_pincode", ["pincode"]),

  // ── infrastructure ───────────────────────────────────
  infrastructure: defineTable({
    pincode: v.string(),
    hospital_count: v.number(),
    clinic_count: v.number(),
    school_count: v.number(),
    college_count: v.number(),
    park_count: v.number(),
    playground_count: v.number(),
    sports_centre_count: v.number(),
    mall_count: v.number(),
    market_count: v.number(),
    pharmacy_count: v.number(),
    bank_count: v.number(),
    atm_count: v.number(),
    bus_stop_count: v.number(),
    five_minute_city_score: v.number(), // 0-10
    cafe_count: v.optional(v.number()),
    restaurant_count: v.optional(v.number()),
    bar_count: v.optional(v.number()),
  }).index("by_pincode", ["pincode"]),

  // ── transit ──────────────────────────────────────────
  transit: defineTable({
    pincode: v.string(),
    nearest_railway_km: v.optional(v.number()),
    nearest_railway_name: v.optional(v.string()),
    nearest_metro_km: v.optional(v.number()),
    nearest_metro_name: v.optional(v.string()),
    nearest_major_railway_km: v.optional(v.number()),
    nearest_major_railway_name: v.optional(v.string()),
    road_density: v.optional(v.number()), // km of road per sq km (omitted in MVP)
  }).index("by_pincode", ["pincode"]),

  // ── cleanliness ──────────────────────────────────────
  cleanliness: defineTable({
    pincode: v.string(),
    ulb_name: v.string(),
    ss_rank: v.optional(v.number()),
    ss_score: v.optional(v.number()),
    ss_year: v.string(),                          // e.g. "2024-25"
    ss_source: v.optional(v.string()),            // "city" | "state" | "national"
    population_category: v.optional(v.string()),
    complaint_rate_per_1000: v.optional(v.number()),
    complaint_source: v.optional(v.string()),
  }).index("by_pincode", ["pincode"]),

  // ── property ─────────────────────────────────────────
  property: defineTable({
    pincode: v.string(),
    city: v.optional(v.string()),
    hpi_value: v.optional(v.number()),            // repurposed → economic activity score 0-100
    hpi_quarter: v.optional(v.string()),          // "99acres-2019" when city rent present
    city_rent_median_2bhk: v.optional(v.number()), // 2BHK rent from 99acres — locality if matched, else city median
    rent_match_level: v.optional(v.string()),      // "locality" | "city" | null
    rent_matched_locality: v.optional(v.string()), // 99acres locality name when level="locality"
    nighttime_light: v.optional(v.number()),
  }).index("by_pincode", ["pincode"]),

  // ── contacts ─────────────────────────────────────────
  contacts: defineTable({
    pincode: v.string(),
    ls_constituency: v.string(),
    ls_mp_name: v.optional(v.string()),
    ls_mp_party: v.optional(v.string()),
    vs_constituency: v.string(),
    vs_mla_name: v.optional(v.string()),
    vs_mla_party: v.optional(v.string()),
    ward_councillor: v.optional(v.string()),
  }).index("by_pincode", ["pincode"]),

  // ── scores + percentiles ─────────────────────────────
  scores: defineTable({
    pincode: v.string(),
    // dimension scores 0-100
    air_quality_score: v.number(),
    safety_score: v.number(),
    infrastructure_score: v.number(),
    transit_score: v.number(),
    cleanliness_score: v.number(),
    property_score: v.number(),
    overall_score: v.number(),
    // national percentiles
    air_quality_national_pct: v.number(),
    safety_national_pct: v.number(),
    infrastructure_national_pct: v.number(),
    transit_national_pct: v.number(),
    cleanliness_national_pct: v.number(),
    overall_national_pct: v.number(),
    national_rank: v.number(),
    national_total: v.number(),
    // state percentiles
    overall_state_pct: v.number(),
    state_rank: v.number(),
    state_total: v.number(),
    // district percentiles
    overall_district_pct: v.number(),
    district_rank: v.number(),
    district_total: v.number(),
    // metro percentiles (null if not in metro)
    overall_metro_pct: v.optional(v.number()),
    metro_rank: v.optional(v.number()),
    metro_total: v.optional(v.number()),
    // derived
    gender_equality_index: v.number(),
    hidden_gem_index: v.optional(v.number()),
    // tier classification used to weight overall_score
    tier: v.optional(v.string()), // "urban" | "semi-urban" | "rural"
    // archetype
    archetype_id: v.string(),
    archetype_name: v.string(),
    archetype_tagline: v.string(),
    archetype_emoji: v.string(),
    cluster_id: v.number(),
    computed_at: v.number(),
    // denormalized for display (from pincodes master)
    district: v.optional(v.string()),
    state: v.optional(v.string()),
    metro_city: v.optional(v.string()),
    // superlative claims
    superlative_label: v.optional(v.string()),
    superlative_scope: v.optional(v.string()),
  })
    .index("by_pincode", ["pincode"])
    .index("by_overall_score", ["overall_score"])
    .index("by_state_rank", ["state_rank"])
    .index("by_district_rank", ["district_rank"]),

  // ── archetypes (cluster definitions) ─────────────────
  archetypes: defineTable({
    cluster_id: v.number(),
    name: v.string(),
    tagline: v.string(),
    emoji: v.string(),
    description: v.string(),
    centroid: v.array(v.number()), // normalized score vector
    pincode_count: v.number(),
  }).index("by_cluster_id", ["cluster_id"]),

  // ── district trivia ───────────────────────────────────
  trivia: defineTable({
    district: v.string(),
    state: v.string(),
    facts: v.array(v.string()), // exactly 3
    generated_at: v.number(),
    narrative: v.optional(v.string()),
  }).index("by_district", ["district"]),
});
