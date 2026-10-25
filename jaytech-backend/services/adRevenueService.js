const AdRevenueReport = require("../models/AdRevenueReport");

async function saveProviderReport(report) {
  if (!report || !report.reportKey || !report.reportDate) {
    throw new Error("A report key and report date are required");
  }

  const values = [
    report.estimatedRevenue ?? 0,
    report.finalizedRevenue ?? 0,
    report.paidRevenue ?? 0,
  ];

  if (
    values.some(
      (value) =>
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
    )
  ) {
    throw new Error("Revenue values must be non-negative numbers");
  }

  return AdRevenueReport.findOneAndUpdate(
    { reportKey: report.reportKey },
    {
      $set: {
        network: report.network || "admob",
        reportDate: new Date(report.reportDate),
        estimatedRevenue: values[0],
        finalizedRevenue: values[1],
        paidRevenue: values[2],
        currency: report.currency || "USD",
        source: "provider_report",
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

module.exports = {
  saveProviderReport,
};