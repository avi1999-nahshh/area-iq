import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
const url = fs.readFileSync("../.env.local","utf8").match(/NEXT_PUBLIC_CONVEX_URL=(\S+)/)[1];
const client = new ConvexHttpClient(url);
// Raw anonymous query via URL — list a sample pincode
const data = await client.query("area:getByPincode", { pincode: "560034" });
console.log("raw result:", JSON.stringify(data).slice(0, 200));
console.log("data === null:", data === null);
