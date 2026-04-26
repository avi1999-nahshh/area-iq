import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 09:00 UTC (~14:30 IST). Per Convex guidelines, use `crons.cron`
// rather than the `crons.daily` helper.
crons.cron(
  "feedback digest",
  "0 9 * * *",
  internal.feedback.sendDailyDigest,
  {},
);

export default crons;
