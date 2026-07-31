import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:nimigora.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      address TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      startDate TEXT NOT NULL,
      expiryDate TEXT NOT NULL,
      txHash TEXT NOT NULL
    )
  `);
}

// Ensure the table exists on startup (useful for local dev)
initDb().catch(console.error);

export async function getSubscription(address: string) {
  const result = await db.execute({
    sql: "SELECT * FROM subscriptions WHERE address = ?",
    args: [address]
  });
  return result.rows[0] || null;
}

export async function saveSubscription(sub: {
  address: string;
  plan: string;
  startDate: string;
  expiryDate: string;
  txHash: string;
}) {
  await db.execute({
    sql: `
      INSERT INTO subscriptions (address, plan, startDate, expiryDate, txHash)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(address) DO UPDATE SET
        plan = excluded.plan,
        startDate = excluded.startDate,
        expiryDate = excluded.expiryDate,
        txHash = excluded.txHash
    `,
    args: [sub.address, sub.plan, sub.startDate, sub.expiryDate, sub.txHash]
  });
}

export async function deleteSubscription(address: string) {
  await db.execute({
    sql: "DELETE FROM subscriptions WHERE address = ?",
    args: [address]
  });
}
