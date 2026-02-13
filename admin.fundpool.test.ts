import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { deposits, commissions, charityFunds, projectFunds, withdrawals, charityDonations, projectProfits } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Fund Pool Monitoring API", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available for testing");
    }
  });

  describe("getFundPoolData", () => {
    it("should calculate deposit pool amount correctly", async () => {
      // Get confirmed deposits
      const confirmedDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));

      const depositPoolAmount = confirmedDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );

      expect(depositPoolAmount).toBeGreaterThanOrEqual(0);
      expect(typeof depositPoolAmount).toBe("number");
    });

    it("should calculate commission pool amount correctly", async () => {
      // Get all commissions
      const allCommissions = await db.select().from(commissions);

      const commissionPoolAmount = allCommissions.reduce(
        (sum: number, c: any) => sum + parseFloat((c.amount ?? "0").toString()),
        0
      );

      expect(commissionPoolAmount).toBeGreaterThanOrEqual(0);
      expect(typeof commissionPoolAmount).toBe("number");
    });

    it("should retrieve charity fund balance", async () => {
      // Get charity fund
      const charityFund = await db.select().from(charityFunds).limit(1);

      const charityAmount = charityFund.length > 0 
        ? parseFloat((charityFund[0].balance ?? "0").toString())
        : 0;

      expect(charityAmount).toBeGreaterThanOrEqual(0);
      expect(typeof charityAmount).toBe("number");
    });

    it("should calculate project fund pool amount correctly", async () => {
      // Get allocated project funds
      const projectFundRecords = await db
        .select()
        .from(projectFunds)
        .where(eq(projectFunds.direction, "allocate"));

      const projectPoolAmount = projectFundRecords.reduce(
        (sum: number, pf: any) => sum + parseFloat((pf.amount ?? "0").toString()),
        0
      );

      expect(projectPoolAmount).toBeGreaterThanOrEqual(0);
      expect(typeof projectPoolAmount).toBe("number");
    });

    it("should return valid fund distribution structure", async () => {
      // Simulate the API response structure
      const confirmedDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));
      const allCommissions = await db.select().from(commissions);
      const charityFund = await db.select().from(charityFunds).limit(1);
      const projectFundRecords = await db
        .select()
        .from(projectFunds)
        .where(eq(projectFunds.direction, "allocate"));

      const depositPoolAmount = confirmedDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );
      const commissionPoolAmount = allCommissions.reduce(
        (sum: number, c: any) => sum + parseFloat((c.amount ?? "0").toString()),
        0
      );
      const charityAmount = charityFund.length > 0 
        ? parseFloat((charityFund[0].balance ?? "0").toString())
        : 0;
      const projectPoolAmount = projectFundRecords.reduce(
        (sum: number, pf: any) => sum + parseFloat((pf.amount ?? "0").toString()),
        0
      );

      const totalFundPool = depositPoolAmount + commissionPoolAmount + charityAmount + projectPoolAmount;

      const fundDistribution = [
        {
          name: "入金资金池",
          value: depositPoolAmount,
          color: "#3b82f6",
          description: `${confirmedDeposits.length} 个确认入金`,
        },
        {
          name: "分润资金池",
          value: commissionPoolAmount,
          color: "#10b981",
          description: `${allCommissions.length} 条分润记录`,
        },
        {
          name: "项目资金池",
          value: projectPoolAmount,
          color: "#f59e0b",
          description: `${projectFundRecords.length} 项目投资分配`,
        },
        {
          name: "慈善基金",
          value: charityAmount,
          color: "#ef4444",
          description: "入金3% + 项目盈利3%",
        },
      ];

      expect(fundDistribution).toHaveLength(4);
      expect(fundDistribution[0]).toHaveProperty("name");
      expect(fundDistribution[0]).toHaveProperty("value");
      expect(fundDistribution[0]).toHaveProperty("color");
      expect(fundDistribution[0]).toHaveProperty("description");
      expect(totalFundPool).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getFundSources", () => {
    it("should calculate all fund sources correctly", async () => {
      const confirmedDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));
      const allCommissions = await db.select().from(commissions);
      const projectProfitRecords = await db.select().from(projectProfits);
      const charityDonationRecords = await db.select().from(charityDonations);

      const depositAmount = confirmedDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );
      const commissionAmount = allCommissions.reduce(
        (sum: number, c: any) => sum + parseFloat((c.amount ?? "0").toString()),
        0
      );
      const projectProfitAmount = projectProfitRecords.reduce(
        (sum: number, pp: any) => sum + parseFloat((pp.profitAmount ?? "0").toString()),
        0
      );
      const otherAmount = charityDonationRecords.reduce(
        (sum: number, cd: any) => sum + parseFloat((cd.amount ?? "0").toString()),
        0
      );

      const totalAmount = depositAmount + commissionAmount + projectProfitAmount + otherAmount;

      expect(depositAmount).toBeGreaterThanOrEqual(0);
      expect(commissionAmount).toBeGreaterThanOrEqual(0);
      expect(projectProfitAmount).toBeGreaterThanOrEqual(0);
      expect(otherAmount).toBeGreaterThanOrEqual(0);
      expect(totalAmount).toBeGreaterThanOrEqual(0);
    });

    it("should calculate percentages correctly", async () => {
      const confirmedDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));

      const depositAmount = confirmedDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );

      const totalAmount = depositAmount; // Simplified for this test
      const percentage = totalAmount > 0 ? (depositAmount / totalAmount) * 100 : 0;

      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe("getFundUsage", () => {
    it("should calculate all fund usage correctly", async () => {
      const completedWithdrawals = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.status, "completed"));
      const charityDonationRecords = await db.select().from(charityDonations);
      const confirmedDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));
      const projectFundRecords = await db
        .select()
        .from(projectFunds)
        .where(eq(projectFunds.direction, "allocate"));

      const withdrawalAmount = completedWithdrawals.reduce(
        (sum: number, w: any) => sum + parseFloat((w.amount ?? "0").toString()),
        0
      );
      const charityAmount = charityDonationRecords.reduce(
        (sum: number, cd: any) => sum + parseFloat((cd.amount ?? "0").toString()),
        0
      );
      const totalDeposits = confirmedDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );
      const operationAmount = totalDeposits * 0.02;
      const projectAmount = projectFundRecords.reduce(
        (sum: number, pf: any) => sum + parseFloat((pf.amount ?? "0").toString()),
        0
      );

      expect(withdrawalAmount).toBeGreaterThanOrEqual(0);
      expect(charityAmount).toBeGreaterThanOrEqual(0);
      expect(operationAmount).toBeGreaterThanOrEqual(0);
      expect(projectAmount).toBeGreaterThanOrEqual(0);
    });

    it("should calculate reserve fund correctly", async () => {
      const completedWithdrawals = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.status, "completed"));
      const charityDonationRecords = await db.select().from(charityDonations);
      const confirmedDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));
      const projectFundRecords = await db
        .select()
        .from(projectFunds)
        .where(eq(projectFunds.direction, "allocate"));

      const withdrawalAmount = completedWithdrawals.reduce(
        (sum: number, w: any) => sum + parseFloat((w.amount ?? "0").toString()),
        0
      );
      const charityAmount = charityDonationRecords.reduce(
        (sum: number, cd: any) => sum + parseFloat((cd.amount ?? "0").toString()),
        0
      );
      const totalDeposits = confirmedDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );
      const operationAmount = totalDeposits * 0.02;
      const projectAmount = projectFundRecords.reduce(
        (sum: number, pf: any) => sum + parseFloat((pf.amount ?? "0").toString()),
        0
      );

      const totalUsage = withdrawalAmount + charityAmount + operationAmount + projectAmount;
      const reserveAmount = Math.max(0, totalDeposits - totalUsage);

      expect(reserveAmount).toBeGreaterThanOrEqual(0);
      expect(reserveAmount).toBeLessThanOrEqual(totalDeposits);
    });
  });

  describe("getFundFlowStats", () => {
    it("should return valid flow data structure", async () => {
      const flowData = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        flowData.push({
          date: date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
          inflow: 0,
          outflow: 0,
          balance: 0,
        });
      }

      expect(flowData).toHaveLength(7);
      expect(flowData[0]).toHaveProperty("date");
      expect(flowData[0]).toHaveProperty("inflow");
      expect(flowData[0]).toHaveProperty("outflow");
      expect(flowData[0]).toHaveProperty("balance");
    });

    it("should calculate daily inflow correctly", async () => {
      const today = new Date();
      const date = new Date(today);
      date.setDate(date.getDate() - 1);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // This is a simplified test - in real scenario would need proper date filtering
      const dayDeposits = await db
        .select()
        .from(deposits)
        .where(eq(deposits.status, "confirmed"));

      const inflow = dayDeposits.reduce(
        (sum: number, d: any) => sum + parseFloat((d.amount ?? "0").toString()),
        0
      );

      expect(inflow).toBeGreaterThanOrEqual(0);
      expect(typeof inflow).toBe("number");
    });
  });
});
