import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import fs from "fs";
const url = fs.readFileSync("../.env.local","utf8").match(/NEXT_PUBLIC_CONVEX_URL=(\S+)/)[1];
const client = new ConvexHttpClient(url);
const rows = await client.query(api.area.searchByPrefix, { prefix: "56003", limit: 10 });
console.log("5600XX matches:", rows);
