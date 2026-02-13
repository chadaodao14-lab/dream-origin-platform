import { getDb } from "../db";
import { deposits, users } from "../../drizzle/schema";

export async function getKPIMetrics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all data
  const allDeposits = await db.select().from(deposits);
  const allUsers = await db.select().from(users);

  // Today's deposit total (confirmed only)
  const todayDeposits = allDeposits.filter((d) => {
    const createdAt = new Date(d.createdAt);
    return createdAt >= today && createdAt < tomorrow && d.status === "confirmed";
  });

  const todayDepositAmount = todayDeposits.reduce(
    (sum, d) => sum + parseFloat((d.amount ?? "0").toString()),
    0
  );

  // New users today
  const newUsersToday = allUsers.filter((u) => {
    const createdAt = new Date(u.createdAt);
    return createdAt >= today && createdAt < tomorrow;
  });

  // Active users today (users who had logins today)
  const activeUsersToday = allUsers.filter((u) => {
    const lastSignedIn = new Date(u.lastSignedIn);
    return lastSignedIn >= today && lastSignedIn < tomorrow;
  });

  return {
    todayDepositAmount: todayDepositAmount.toFixed(2),
    todayDepositCount: todayDeposits.length,
    newUsersCount: newUsersToday.length,
    activeUsersCount: activeUsersToday.length,
    timestamp: new Date().toISOString(),
  };
}
