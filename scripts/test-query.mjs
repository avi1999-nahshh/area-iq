import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs";
const url = fs.readFileSync("../.env.local","utf8").match(/NEXT_PUBLIC_CONVEX_URL=(\S+)/)[1];
const client = new ConvexHttpClient(url);
const data = await client.query(api.area.getByPincode, { pincode: "560034" });
console.log("type:", typeof data);
console.log("keys:", data ? Object.keys(data) : null);
if (data) {
  console.log("pincode.name:", data.pincode?.name);
  console.log("scores.overall_score:", data.scores?.overall_score);
  console.log("scores.tier:", data.scores?.tier);
  console.log("archetype.name:", data.archetype?.name);
}
