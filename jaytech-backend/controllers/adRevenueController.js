const AdRevenueReport = require("../models/AdRevenueReport");

exports.getRevenueSummary = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access required",
      });
    }

    const reports = await AdRevenueReport.aggregate([
      {
        $group: {
          _id: {
            network: "$network",
            currency: "$currency",
          },
          estimatedRevenue: { $sum: "$estimatedRevenue" },
          finalizedRevenue: { $sum: "$finalizedRevenue" },
          paidRevenue: { $sum: "$paidRevenue" },
          reportCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.network": 1,
          "_id.currency": 1,
        },
      },
    ]);

    const latestReports = await AdRevenueReport.find()
      .sort({ reportDate: -1 })
      .limit(30)
      .lean();

    return res.json({
      success: true,
      summaries: reports.map((item) => ({
        network: item._id.network,
        currency: item._id.currency,
        estimatedRevenue: item.estimatedRevenue,
        finalizedRevenue: item.finalizedRevenue,
        paidRevenue: item.paidRevenue,
        reportCount: item.reportCount,
      })),
      latestReports,
    });
  } catch (error) {
    console.error("Ad revenue summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load ad revenue reports",
    });
  }
};