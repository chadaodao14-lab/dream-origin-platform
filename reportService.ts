import { PDFDocument, rgb } from "pdf-lib";
import { Workbook } from "exceljs";
import { getDb } from "../db";
import { deposits, commissions, charityFunds, projectFunds, withdrawals, charityDonations, projectProfits } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate fund pool monitoring report data
 */
export async function generateReportData() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get deposit fund pool
  const confirmedDeposits = await db
    .select()
    .from(deposits)
    .where(eq(deposits.status, "confirmed"));
  const depositPoolAmount = confirmedDeposits.reduce(
    (sum, d) => sum + parseFloat((d.amount ?? "0").toString()),
    0
  );

  // Get commission fund pool
  const allCommissions = await db.select().from(commissions);
  const commissionPoolAmount = allCommissions.reduce(
    (sum, c) => sum + parseFloat((c.amount ?? "0").toString()),
    0
  );

  // Get charity fund
  const charityFund = await db.select().from(charityFunds).limit(1);
  const charityAmount = charityFund.length > 0
    ? parseFloat((charityFund[0].balance ?? "0").toString())
    : 0;

  // Get project fund pool
  const projectFundRecords = await db
    .select()
    .from(projectFunds)
    .where(eq(projectFunds.direction, "allocate"));
  const projectPoolAmount = projectFundRecords.reduce(
    (sum, pf) => sum + parseFloat((pf.amount ?? "0").toString()),
    0
  );

  const totalFundPool = depositPoolAmount + commissionPoolAmount + charityAmount + projectPoolAmount;

  // Fund sources
  const projectProfitRecords = await db.select().from(projectProfits);
  const projectProfitAmount = projectProfitRecords.reduce(
    (sum, pp) => sum + parseFloat((pp.profitAmount ?? "0").toString()),
    0
  );

  const charityDonationRecords = await db.select().from(charityDonations);
  const otherAmount = charityDonationRecords.reduce(
    (sum, cd) => sum + parseFloat((cd.amount ?? "0").toString()),
    0
  );

  const totalSourceAmount = depositPoolAmount + commissionPoolAmount + projectProfitAmount + otherAmount;

  // Fund usage
  const completedWithdrawals = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.status, "completed"));
  const withdrawalAmount = completedWithdrawals.reduce(
    (sum, w) => sum + parseFloat((w.amount ?? "0").toString()),
    0
  );

  const charityDonationAmount = charityDonationRecords.reduce(
    (sum, cd) => sum + parseFloat((cd.amount ?? "0").toString()),
    0
  );

  const operationAmount = depositPoolAmount * 0.02;
  const projectAmount = projectFundRecords.reduce(
    (sum, pf) => sum + parseFloat((pf.amount ?? "0").toString()),
    0
  );

  const totalUsage = withdrawalAmount + charityDonationAmount + operationAmount + projectAmount;
  const reserveAmount = Math.max(0, depositPoolAmount - totalUsage);
  const totalUsageAmount = totalUsage + reserveAmount;

  return {
    generatedAt: new Date(),
    fundPool: {
      total: totalFundPool,
      deposits: depositPoolAmount,
      commissions: commissionPoolAmount,
      charity: charityAmount,
      projects: projectPoolAmount,
    },
    fundSources: [
      {
        source: "User Deposits",
        amount: depositPoolAmount,
        percentage: totalSourceAmount > 0 ? (depositPoolAmount / totalSourceAmount) * 100 : 0,
        count: confirmedDeposits.length,
      },
      {
        source: "Commission Distribution",
        amount: commissionPoolAmount,
        percentage: totalSourceAmount > 0 ? (commissionPoolAmount / totalSourceAmount) * 100 : 0,
        count: allCommissions.length,
      },
      {
        source: "Project Profits",
        amount: projectProfitAmount,
        percentage: totalSourceAmount > 0 ? (projectProfitAmount / totalSourceAmount) * 100 : 0,
        count: projectProfitRecords.length,
      },
      {
        source: "Other Income",
        amount: otherAmount,
        percentage: totalSourceAmount > 0 ? (otherAmount / totalSourceAmount) * 100 : 0,
        count: charityDonationRecords.length,
      },
    ],
    fundUsage: [
      {
        usage: "User Withdrawals",
        amount: withdrawalAmount,
        percentage: totalUsageAmount > 0 ? (withdrawalAmount / totalUsageAmount) * 100 : 0,
        count: completedWithdrawals.length,
      },
      {
        usage: "Charity Donations",
        amount: charityDonationAmount,
        percentage: totalUsageAmount > 0 ? (charityDonationAmount / totalUsageAmount) * 100 : 0,
        count: charityDonationRecords.length,
      },
      {
        usage: "Platform Operations",
        amount: operationAmount,
        percentage: totalUsageAmount > 0 ? (operationAmount / totalUsageAmount) * 100 : 0,
        count: 1,
      },
      {
        usage: "Project Investments",
        amount: projectAmount,
        percentage: totalUsageAmount > 0 ? (projectAmount / totalUsageAmount) * 100 : 0,
        count: projectFundRecords.length,
      },
      {
        usage: "Reserve Fund",
        amount: reserveAmount,
        percentage: totalUsageAmount > 0 ? (reserveAmount / totalUsageAmount) * 100 : 0,
        count: 1,
      },
    ],
  };
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(): Promise<Buffer> {
  const data = await generateReportData();

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  let y = 750;

  const helveticaFont = await pdfDoc.embedFont("Helvetica");

  const drawText = (text: string, size: number = 12) => {
    if (y < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = 750;
    }
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    y -= size + 10;
  };

  // Title
  page.drawText("Fund Pool Monitoring Report", {
    x: 50,
    y: 800,
    size: 24,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  y = 760;

  // Report info
  drawText(`Generated: ${data.generatedAt.toLocaleString("en-US")}`, 10);
  y -= 10;

  // Fund Pool Summary
  drawText("Fund Pool Summary", 14);
  drawText(`Total: $${data.fundPool.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 12);
  drawText(`Deposit Pool: $${data.fundPool.deposits.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 11);
  drawText(`Commission Pool: $${data.fundPool.commissions.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 11);
  drawText(`Project Pool: $${data.fundPool.projects.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 11);
  drawText(`Charity Fund: $${data.fundPool.charity.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, 11);
  y -= 10;

  // Fund Sources
  drawText("Fund Sources Analysis", 14);
  for (const source of data.fundSources) {
    drawText(
      `${source.source}: $${source.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${source.percentage.toFixed(1)}%)`,
      11
    );
  }
  y -= 10;

  // Fund Usage
  drawText("Fund Usage Analysis", 14);
  for (const usage of data.fundUsage) {
    drawText(
      `${usage.usage}: $${usage.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} (${usage.percentage.toFixed(1)}%)`,
      11
    );
  }

  return Buffer.from(await pdfDoc.save());
}

/**
 * Generate Excel report
 */
export async function generateExcelReport(): Promise<Buffer> {
  const data = await generateReportData();

  const workbook = new Workbook();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet("Fund Pool Overview");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 20 },
    { header: "Amount (USD)", key: "amount", width: 20 },
    { header: "Percentage", key: "percentage", width: 15 },
  ];

  summarySheet.addRow({
    metric: "Total Fund Pool",
    amount: data.fundPool.total.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    percentage: "100%",
  });

  summarySheet.addRow({
    metric: "Deposit Pool",
    amount: data.fundPool.deposits.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    percentage: `${((data.fundPool.deposits / data.fundPool.total) * 100).toFixed(1)}%`,
  });

  summarySheet.addRow({
    metric: "Commission Pool",
    amount: data.fundPool.commissions.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    percentage: `${((data.fundPool.commissions / data.fundPool.total) * 100).toFixed(1)}%`,
  });

  summarySheet.addRow({
    metric: "Project Pool",
    amount: data.fundPool.projects.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    percentage: `${((data.fundPool.projects / data.fundPool.total) * 100).toFixed(1)}%`,
  });

  summarySheet.addRow({
    metric: "Charity Fund",
    amount: data.fundPool.charity.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    percentage: `${((data.fundPool.charity / data.fundPool.total) * 100).toFixed(1)}%`,
  });

  // Sheet 2: Fund Sources
  const sourcesSheet = workbook.addWorksheet("Fund Sources");
  sourcesSheet.columns = [
    { header: "Source", key: "source", width: 20 },
    { header: "Amount (USD)", key: "amount", width: 20 },
    { header: "Percentage", key: "percentage", width: 15 },
    { header: "Count", key: "count", width: 15 },
  ];

  for (const source of data.fundSources) {
    sourcesSheet.addRow({
      source: source.source,
      amount: source.amount.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      percentage: `${source.percentage.toFixed(1)}%`,
      count: source.count,
    });
  }

  // Sheet 3: Fund Usage
  const usageSheet = workbook.addWorksheet("Fund Usage");
  usageSheet.columns = [
    { header: "Usage", key: "usage", width: 20 },
    { header: "Amount (USD)", key: "amount", width: 20 },
    { header: "Percentage", key: "percentage", width: 15 },
    { header: "Count", key: "count", width: 15 },
  ];

  for (const usage of data.fundUsage) {
    usageSheet.addRow({
      usage: usage.usage,
      amount: usage.amount.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      percentage: `${usage.percentage.toFixed(1)}%`,
      count: usage.count,
    });
  }

  // Sheet 4: Report Info
  const infoSheet = workbook.addWorksheet("Report Info");
  infoSheet.columns = [
    { header: "Item", key: "key", width: 30 },
    { header: "Value", key: "value", width: 40 },
  ];

  infoSheet.addRow({
    key: "Generated",
    value: data.generatedAt.toLocaleString("en-US"),
  });

  infoSheet.addRow({
    key: "Report Type",
    value: "Fund Pool Monitoring Report",
  });

  infoSheet.addRow({
    key: "Platform",
    value: "DreamSource Venture Investment Platform",
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
