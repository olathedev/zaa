import { getDb } from "../db/client.js";
import {
  messages,
  paymentTransactions,
  userSecurity,
  users,
  virtualAccounts,
  whatsappContacts,
  walletBalances,
  workerProfileAssessments,
  workerProfiles,
} from "../db/schema.js";

const isDevelopment = process.env.NODE_ENV !== "production";
const isForced = process.argv.includes("--force");

if (!isDevelopment && !isForced) {
  throw new Error("Refusing to reset database outside development without --force");
}

const db = getDb();

console.log("Resetting application records...");

await db.delete(messages);
await db.delete(paymentTransactions);
await db.delete(walletBalances);
await db.delete(userSecurity);
await db.delete(virtualAccounts);
await db.delete(workerProfileAssessments);
await db.delete(workerProfiles);
await db.delete(whatsappContacts);
await db.delete(users);

console.log("Database records cleared.");
